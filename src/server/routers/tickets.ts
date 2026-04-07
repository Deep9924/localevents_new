// src/server/routers/tickets.ts
import { router, protectedProcedure } from "../trpc";
import { getUserTickets } from "@/server/db";

export const ticketsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const tickets = await getUserTickets(userId);
    return tickets;
  }),
});