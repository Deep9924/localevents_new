// src/server/routers/tickets.ts
import { router, protectedProcedure } from "../trpc";
import { getUserTickets } from "@/server/db";
import { z } from "zod";

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
});
