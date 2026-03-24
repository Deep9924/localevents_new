import { router } from "../trpc";
import { authRouter } from "./auth";
import { eventsRouter } from "./events";
import { organizersRouter } from "./organizers";
import { savedEventsRouter } from "./savedEvents";

export const appRouter = router({
  auth: authRouter,
  events: eventsRouter,
  organizers: organizersRouter,
  savedEvents: savedEventsRouter,
});

export type AppRouter = typeof appRouter;
