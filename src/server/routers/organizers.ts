import { publicProcedure, router } from "../trpc";
import { z } from "zod";
import { getOrganizerById, getOrganizerEvents } from "../db";

export const organizersRouter = router({
  getById: publicProcedure
    .input(z.object({ organizerId: z.number() }))
    .query(async ({ input }) => getOrganizerById(input.organizerId)),

  getEvents: publicProcedure
    .input(z.object({ organizerId: z.number(), limit: z.number().optional() }))
    .query(async ({ input }) => getOrganizerEvents(input.organizerId, input.limit ?? 5)),
});
