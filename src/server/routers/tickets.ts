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
        quantity: z.number().min(1).max(100),
        priceInCents: z.number().min(0),
        currency: z.string().default("CAD"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const userEmail = ctx.user.email || "customer@example.com";

      if (!stripe) {
        throw new Error("Stripe secret key not configured");
      }

      if (input.priceInCents === 0) {
        // Free event - create ticket directly without Stripe
        const { getDb } = await import("@/server/db");
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const { tickets } = await import("@/server/db/schema");
        const [result] = await db.insert(tickets).values({
          userId,
          eventId: input.eventId,
          quantity: input.quantity,
          currency: input.currency,
          total: 0,
          status: "paid",
        });

        return { success: true, ticketId: result.insertId, free: true };
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: input.currency.toLowerCase(),
              product_data: {
                name: input.eventTitle,
                description: `${input.quantity} ticket(s)`,
              },
              unit_amount: input.priceInCents,
            },
            quantity: input.quantity,
          },
        ],
        mode: "payment",
        customer_email: userEmail,
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/account/tickets?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/`,
        metadata: {
          userId: String(userId),
          eventId: input.eventId,
          quantity: String(input.quantity),
        },
      });

      return {
        success: true,
        sessionId: session.id,
        url: session.url,
      };
    }),
});
