// src/server/routers/tickets.ts
import { router, protectedProcedure } from "../trpc";
import { getUserTickets } from "@/server/db";
import { z } from "zod";
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-15.acacia",
    })
  : null;

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
        eventTitle: z.string(),
        tierId: z.number().optional(),
        tierName: z.string().optional(),
        quantity: z.number().min(1).max(100),
        unitPriceInCents: z.number().min(0),
        currency: z.string().default("CAD"),
        taxRate: z.number().default(0.13),
        serviceFeePercent: z.number().default(0.03),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const userEmail = ctx.user.email || "customer@example.com";

      if (!stripe) {
        throw new Error("Stripe secret key not configured");
      }

      // Calculate fees
      const subtotalCents = input.unitPriceInCents * input.quantity;
      const subtotalDollars = subtotalCents / 100;
      const taxAmountDollars = subtotalDollars * input.taxRate;
      const serviceFeeAmountDollars = subtotalDollars * input.serviceFeePercent;
      const totalDollars = subtotalDollars + taxAmountDollars + serviceFeeAmountDollars;
      const totalCents = Math.round(totalDollars * 100);

      if (input.unitPriceInCents === 0) {
        // Free event - create ticket directly without Stripe
        const { getDb } = await import("@/server/db");
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const { tickets } = await import("@/server/db/schema");
        await db.insert(tickets).values({
          userId,
          eventId: input.eventId,
          tierId: input.tierId,
          quantity: input.quantity,
          currency: input.currency,
          unitPrice: 0,
          subtotal: 0,
          serviceFee: 0,
          taxAmount: 0,
          total: 0,
          status: "paid",
        });

        return { success: true, free: true };
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: input.currency.toLowerCase(),
              product_data: {
                name: input.eventTitle,
                description: input.tierName ? `${input.tierName} - ${input.quantity} ticket(s)` : `${input.quantity} ticket(s)`,
              },
              unit_amount: input.unitPriceInCents,
            },
            quantity: input.quantity,
          },
          ...(input.taxRate > 0 ? [{
            price_data: {
              currency: input.currency.toLowerCase(),
              product_data: {
                name: "HST (13%)",
              },
              unit_amount: Math.round((taxAmountDollars / input.quantity) * 100),
            },
            quantity: input.quantity,
          }] : []),
          ...(input.serviceFeePercent > 0 ? [{
            price_data: {
              currency: input.currency.toLowerCase(),
              product_data: {
                name: "Service Fee",
              },
              unit_amount: Math.round((serviceFeeAmountDollars / input.quantity) * 100),
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
          subtotal: String(Math.round(subtotalDollars * 100)),
          taxAmount: String(Math.round(taxAmountDollars * 100)),
          serviceFee: String(Math.round(serviceFeeAmountDollars * 100)),
        },
      });

      return {
        success: true,
        sessionId: session.id,
        url: session.url,
        breakdown: {
          subtotal: subtotalDollars,
          tax: taxAmountDollars,
          serviceFee: serviceFeeAmountDollars,
          total: totalDollars,
        },
      };
    }),
});
