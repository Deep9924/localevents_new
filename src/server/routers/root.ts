import { router } from "../trpc";

import { eventsRouter } from "./events";
import { organizersRouter } from "./organizers";
import { savedEventsRouter } from "./savedEvents";
import { ticketsRouter } from "./tickets";
import { ticketTiersRouter } from "./ticketTiers";

export const appRouter = router({

  events: eventsRouter,
  organizers: organizersRouter,
  savedEvents: savedEventsRouter,
  tickets: ticketsRouter,
  ticketTiers: ticketTiersRouter,
});

export type AppRouter = typeof appRouter;