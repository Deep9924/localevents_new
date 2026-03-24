import { protectedProcedure, router } from "../trpc";
import { z } from "zod";
import { saveEvent, unsaveEvent, getUserSavedEvents, isEventSaved } from "../db";

export const savedEventsRouter = router({
  save: protectedProcedure
    .input(z.object({
      eventId: z.string(),
      eventTitle: z.string(),
      eventDate: z.string(),
      eventCity: z.string(),
    }))
    .mutation(async ({ ctx, input }) =>
      saveEvent(ctx.user.id, input.eventId, input.eventTitle, input.eventDate, input.eventCity)
    ),

  unsave: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ ctx, input }) => unsaveEvent(ctx.user.id, input.eventId)),

  list: protectedProcedure.query(async ({ ctx }) => getUserSavedEvents(ctx.user.id)),

  isSaved: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => isEventSaved(ctx.user.id, input.eventId)),
});
