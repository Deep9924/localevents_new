import { router } from "../trpc";
import { authRouter } from "./auth";
import { eventsRouter } from "./events";
import { organizersRouter } from "./organizers";
import { savedEventsRouter } from "./savedEvents";
import { ticketsRouter } from "./tickets"; // ⬅ add this

export const appRouter = router({
  auth: authRouter,
  events: eventsRouter,
  organizers: organizersRouter,
  savedEvents: savedEventsRouter,
  tickets: ticketsRouter, // ⬅ register here
});

export type AppRouter = typeof appRouter;