// src/server/routers/tickets.ts
import { router, protectedProcedure } from "../trpc";
import { getUserTickets } from "@/server/db";
import { getDb } from "@/server/db";
import { events, ticketTiers, tickets } from "@/server/db/schema";
import { z } from "zod";
import Stripe from "stripe";
import { eq } from "drizzle-orm";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-03-25.dahlia",
    })
  : null;

const TAX_RATE = 0.13;           // HST 13%
const SERVICE_FEE_PERCENT = 0.03; // 3% service fee

export const ticketsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getUserTickets(ctx.user.id);
  }),

  getById: protectedProcedure
    .input(z.object({ ticketId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(tickets)
        .where(eq(tickets.id, input.ticketId))
        .limit(1);

      const ticket = result[0];

      // Ensure the ticket belongs to this user
      if (!ticket || ticket.userId !== ctx.user.id) {
        throw new Error("Ticket not found or access denied");
      }

      return ticket;
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userTickets = await getUserTickets(ctx.user.id);

    return {
      total: userTickets.length,
      paid: userTickets.filter((t) => t.status === "paid").length,
      pending: userTickets.filter((t) => t.status === "pending").length,
      refunded: userTickets.filter((t) => t.status === "refunded").length,
      totalSpent: userTickets
        .filter((t) => t.status === "paid")
        .reduce((sum, t) => sum + Number(t.total), 0),
    };
  }),

  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        quantity: z.number().min(1).max(100),
        tierId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const userEmail = ctx.user.email || "customer@example.com";

      if (!stripe) {
        throw new Error("Stripe secret key not configured");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // ============================================================
      // STEP 1: Fetch event from database (server-side validation)
      // ============================================================
      const eventResult = await db
        .select()
        .from(events)
        .where(eq(events.id, input.eventId))
        .limit(1);

      if (eventResult.length === 0) {
        throw new Error("Event not found");
      }

      const event = eventResult[0];
      const eventTitle = event.title;

      // ============================================================
      // STEP 2: Fetch ticket tier from database (if specified)
      // ============================================================
      let unitPriceDollars = 0;
      let tierName = "Standard Ticket";

      if (input.tierId) {
        const tierResult = await db
          .select()
          .from(ticketTiers)
          .where(eq(ticketTiers.id, input.tierId))
          .limit(1);

        if (tierResult.length === 0) {
          throw new Error("Ticket tier not found");
        }

        const tier = tierResult[0];

        if (tier.eventId !== input.eventId) {
          throw new Error("Ticket tier does not belong to this event");
        }

        if (tier.isActive === 0) {
          throw new Error("This ticket tier is no longer available");
        }

        if (tier.quantity && tier.sold && tier.sold >= tier.quantity) {
          throw new Error("This ticket tier is sold out");
        }

        unitPriceDollars = tier.price;
        tierName = tier.name;
      } else {
        if (event.price === "Free" || event.price === null) {
          unitPriceDollars = 0;
        } else {
          const parsed = parseFloat(String(event.price).replace(/[^\d.]/g, ""));
          unitPriceDollars = isNaN(parsed) ? 0 : parsed;
        }
      }

      // ============================================================
      // STEP 3: Calculate all fees server-side
      // ============================================================
      const subtotalDollars = unitPriceDollars * input.quantity;
      const taxAmountDollars = subtotalDollars * TAX_RATE;
      const serviceFeeAmountDollars = subtotalDollars * SERVICE_FEE_PERCENT;
      const totalDollars = subtotalDollars + taxAmountDollars + serviceFeeAmountDollars;

      const unitPriceCents = Math.round(unitPriceDollars * 100);
      const subtotalCents = Math.round(subtotalDollars * 100);
      const taxAmountCents = Math.round(taxAmountDollars * 100);
      const serviceFeeAmountCents = Math.round(serviceFeeAmountDollars * 100);
      const totalCents = Math.round(totalDollars * 100);

      // ============================================================
      // STEP 4: Handle free tickets
      // ============================================================
      if (unitPriceCents === 0) {
        await db.insert(tickets).values({
          userId,
          eventId: input.eventId,
          tierId: input.tierId,
          quantity: input.quantity,
          currency: "CAD",
          unitPrice: 0,
          subtotal: 0,
          serviceFee: 0,
          taxAmount: 0,
          total: 0,
          status: "paid",
        });

        return { success: true, free: true };
      }

      // ============================================================
      // STEP 5: Create Stripe session with server-calculated prices
      // ============================================================
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "cad",
              product_data: {
                name: eventTitle,
                description: `${tierName} - ${input.quantity} ticket(s)`,
              },
              unit_amount: unitPriceCents,
            },
            quantity: input.quantity,
          },
          ...(TAX_RATE > 0
            ? [
                {
                  price_data: {
                    currency: "cad",
                    product_data: { name: "HST (13%)" },
                    unit_amount: Math.round(taxAmountCents / input.quantity),
                  },
                  quantity: input.quantity,
                },
              ]
            : []),
          ...(SERVICE_FEE_PERCENT > 0
            ? [
                {
                  price_data: {
                    currency: "cad",
                    product_data: { name: "Service Fee (3%)" },
                    unit_amount: Math.round(serviceFeeAmountCents / input.quantity),
                  },
                  quantity: input.quantity,
                },
              ]
            : []),
        ],
        mode: "payment",
        customer_email: userEmail,
        success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/account/tickets?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/`,
        metadata: {
          userId: String(userId),
          eventId: input.eventId,
          tierId: input.tierId ? String(input.tierId) : "default",
          quantity: String(input.quantity),
          unitPrice: String(unitPriceCents),
          subtotal: String(subtotalCents),
          taxAmount: String(taxAmountCents),
          serviceFee: String(serviceFeeAmountCents),
          total: String(totalCents),
        },
      });

      return {
        success: true,
        sessionId: session.id,
        url: session.url,
        breakdown: {
          unitPrice: unitPriceDollars,
          subtotal: subtotalDollars,
          tax: taxAmountDollars,
          serviceFee: serviceFeeAmountDollars,
          total: totalDollars,
        },
      };
    }),
});