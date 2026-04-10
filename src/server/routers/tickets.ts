// src/server/routers/tickets.ts
import { router, protectedProcedure } from "../trpc";
import { getUserTickets } from "@/server/db";
import { z } from "zod";
import Stripe from "stripe";
import { eq } from "drizzle-orm";

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-15.acacia",
    })
  : null;

// Server-side configuration - NOT from client
const TAX_RATE = 0.13; // HST 13%
const SERVICE_FEE_PERCENT = 0.03; // 3% service fee

export const ticketsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const tickets = await getUserTickets(userId);
    return tickets;
  }),

  getById: protectedProcedure
    .input(z.object({ ticketId: z.number() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const tickets = await getUserTickets(userId);
      const ticket = tickets.find((t) => t.id === input.ticketId);
      if (!ticket) {
        throw new Error("Ticket not found or access denied");
      }
      return ticket;
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const tickets = await getUserTickets(userId);

    const stats = {
      total: tickets.length,
      paid: tickets.filter((t) => t.status === "paid").length,
      pending: tickets.filter((t) => t.status === "pending").length,
      refunded: tickets.filter((t) => t.status === "refunded").length,
      totalSpent: tickets
        .filter((t) => t.status === "paid")
        .reduce((sum, t) => sum + Number(t.total), 0),
    };

    return stats;
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

      // ============================================================
      // STEP 1: Fetch event from database (server-side validation)
      // ============================================================
      const { getDb } = await import("@/server/db");
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { events, ticketTiers, tickets } = await import("@/server/db/schema");
      
      const eventResult = await db
        .select()
        .from(events)
        .where(eq(events.id, input.eventId));

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
          .where(eq(ticketTiers.id, input.tierId));

        if (tierResult.length === 0) {
          throw new Error("Ticket tier not found");
        }

        const tier = tierResult[0];

        // Validate that tier belongs to this event
        if (tier.eventId !== input.eventId) {
          throw new Error("Ticket tier does not belong to this event");
        }

        // Validate tier is active
        if (tier.isActive === 0) {
          throw new Error("This ticket tier is no longer available");
        }

        // Validate availability
        if (tier.quantity && tier.sold && tier.sold >= tier.quantity) {
          throw new Error("This ticket tier is sold out");
        }

        unitPriceDollars = tier.price;
        tierName = tier.name;
      } else {
        // Use event's default price
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
          ...(TAX_RATE > 0 ? [{
            price_data: {
              currency: "cad",
              product_data: {
                name: "HST (13%)",
              },
              unit_amount: Math.round(taxAmountCents / input.quantity),
            },
            quantity: input.quantity,
          }] : []),
          ...(SERVICE_FEE_PERCENT > 0 ? [{
            price_data: {
              currency: "cad",
              product_data: {
                name: "Service Fee (3%)",
              },
              unit_amount: Math.round(serviceFeeAmountCents / input.quantity),
            },
            quantity: input.quantity,
          }] : []),
        ],
        mode: "payment",
        customer_email: userEmail,
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/account/tickets?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/`,
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
