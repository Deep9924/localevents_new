// src/server/routers/ticketTiers.ts
import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import { getDb } from "@/server/db";
import { ticketTiers } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const ticketTiersRouter = router({
  getByEvent: publicProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const tiers = await db
        .select()
        .from(ticketTiers)
        .where(eq(ticketTiers.eventId, input.eventId));

      return tiers;
    }),
});
