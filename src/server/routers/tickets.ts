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

const TAX_RATE = 0;              // set to 0.05 when GST registered, 0.11 for SK
const SERVICE_FEE_PERCENT = 0.03;

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
      const userEmail = ctx.user.email || undefined;

      if (!stripe) throw new Error("Stripe secret key not configured");

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // ── Fetch event ───────────────────────────────────────────────────
      const eventResult = await db
        .select()
        .from(events)
        .where(eq(events.id, input.eventId))
        .limit(1);

      if (eventResult.length === 0) throw new Error("Event not found");
      const event = eventResult[0];

      // ── Fetch tier ────────────────────────────────────────────────────
      let unitPriceDollars = 0;
      let tierName = "Standard Ticket";
      let tier: typeof ticketTiers.$inferSelect | null = null;

      if (input.tierId) {
        const tierResult = await db
          .select()
          .from(ticketTiers)
          .where(eq(ticketTiers.id, input.tierId))
          .limit(1);

        if (tierResult.length === 0) throw new Error("Ticket tier not found");
        tier = tierResult[0];

        if (tier.eventId !== input.eventId)
          throw new Error("Ticket tier does not belong to this event");
        if (tier.isActive === 0)
          throw new Error("This ticket tier is no longer available");
        if (tier.quantity && Number(tier.sold ?? 0) >= Number(tier.quantity))
          throw new Error("This ticket tier is sold out");

        unitPriceDollars = Number(tier.price); // coerce string decimal
        tierName = tier.name;
      } else {
        if (event.price !== "Free" && event.price !== null) {
          const parsed = parseFloat(String(event.price).replace(/[^d.]/g, ""));
          unitPriceDollars = isNaN(parsed) ? 0 : parsed;
        }
      }

      // ── Calculate fees ────────────────────────────────────────────────
      const subtotalDollars = unitPriceDollars * input.quantity;
      const taxAmountDollars = subtotalDollars * TAX_RATE;
      const serviceFeeAmountDollars = subtotalDollars * SERVICE_FEE_PERCENT;
      const totalDollars = subtotalDollars + taxAmountDollars + serviceFeeAmountDollars;

      const unitPriceCents = Math.round(unitPriceDollars * 100);
      const subtotalCents = Math.round(subtotalDollars * 100);
      const taxAmountCents = Math.round(taxAmountDollars * 100);
      const serviceFeeAmountCents = Math.round(serviceFeeAmountDollars * 100);
      const totalCents = Math.round(totalDollars * 100);

      // ── Free ticket — insert directly as paid ─────────────────────────
      if (unitPriceCents === 0) {
        await db.insert(tickets).values({
          userId,
          eventId: input.eventId,
          tierId: input.tierId ?? null,
          quantity: input.quantity,
          currency: "CAD",
          unitPrice: 0,
          subtotal: 0,
          serviceFee: 0,
          taxAmount: 0,
          total: 0,
          status: "paid",
        });

        if (tier && input.tierId) {
          await db
            .update(ticketTiers)
            .set({ sold: Number(tier.sold ?? 0) + input.quantity })
            .where(eq(ticketTiers.id, input.tierId));
        }

        return { success: true, free: true };
      }

      // ── Paid — insert as pending, webhook confirms ────────────────────
      const [inserted] = await db.insert(tickets).values({
        userId,
        eventId: input.eventId,
        tierId: input.tierId ?? null,
        quantity: input.quantity,
        currency: "CAD",
        unitPrice: unitPriceDollars,
        subtotal: subtotalDollars,
        serviceFee: serviceFeeAmountDollars,
        taxAmount: taxAmountDollars,
        total: totalDollars,
        status: "pending",
        stripeSessionId: null,
      });

      const ticketId = (inserted as any).insertId;

      // ── Stripe Checkout session ───────────────────────────────────────
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
        {
          price_data: {
            currency: "cad",
            product_data: {
              name: String(event.title),
              description: `${tierName} × ${input.quantity}`,
            },
            unit_amount: unitPriceCents,
          },
          quantity: input.quantity,
        },
      ];

      if (serviceFeeAmountCents > 0) {
        lineItems.push({
          price_data: {
            currency: "cad",
            product_data: { name: "Service Fee (3%)" },
            unit_amount: Math.round(serviceFeeAmountCents / input.quantity),
          },
          quantity: input.quantity,
        });
      }

      if (taxAmountCents > 0) {
        lineItems.push({
          price_data: {
            currency: "cad",
            product_data: { name: `Tax (${TAX_RATE * 100}%)` },
            unit_amount: Math.round(taxAmountCents / input.quantity),
          },
          quantity: input.quantity,
        });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        customer_email: userEmail,
        success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/account/tickets?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/${event.citySlug}/${event.slug}`,
        metadata: {
          ticketId: String(ticketId),   // ← used by webhook to update status
          userId: String(userId),
          eventId: input.eventId,
          tierId: input.tierId ? String(input.tierId) : "",
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
        free: false,
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
