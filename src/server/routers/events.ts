import { publicProcedure, router } from "../trpc";
import { z } from "zod";
import {
  getEventBySlug, getFeaturedEvents,
  getSimilarEvents, searchEvents, getDb,
} from "../db";
import { events, cities, categories } from "../db/schema";
import { sql, eq, and, like, or, gte, lte } from "drizzle-orm";

export const eventsRouter = router({
  getCities: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(cities).orderBy(cities.name);
  }),

  getCategories: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(categories).orderBy(categories.label);
  }),

  getByCity: publicProcedure
    .input(z.object({ 
      citySlug: z.string(),
      category: z.string().optional(),
      date: z.enum(["all", "today", "tomorrow", "weekend", "week"]).optional(),
      search: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let conditions = [eq(events.citySlug, input.citySlug)];

      if (input.category && input.category !== "all") {
        conditions.push(eq(events.category, input.category));
      }

      if (input.search) {
        const searchPattern = `%${input.search}%`;
        conditions.push(or(
          like(events.title, searchPattern),
          like(events.venue, searchPattern),
          like(events.description, searchPattern)
        ));
      }

      if (input.date && input.date !== "all") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];
        
        if (input.date === "today") {
          conditions.push(eq(events.date, todayStr));
        } else if (input.date === "tomorrow") {
          const tomorrow = new Date(today);
          tomorrow.setDate(today.getDate() + 1);
          conditions.push(eq(events.date, tomorrow.toISOString().split('T')[0]));
        } else if (input.date === "week") {
          const nextWeek = new Date(today);
          nextWeek.setDate(today.getDate() + 7);
          conditions.push(and(gte(events.date, todayStr), lte(events.date, nextWeek.toISOString().split('T')[0])));
        } else if (input.date === "weekend") {
          const dayOfWeek = today.getDay();
          const daysToSat = (6 - dayOfWeek + 7) % 7;
          const sat = new Date(today);
          sat.setDate(today.getDate() + daysToSat);
          const sun = new Date(sat);
          sun.setDate(sat.getDate() + 1);
          conditions.push(and(gte(events.date, sat.toISOString().split('T')[0]), lte(events.date, sun.toISOString().split('T')[0])));
        }
      }

      return db.select().from(events)
        .where(and(...conditions))
        .orderBy(sql`${events.isFeatured} DESC`, sql`${events.createdAt} DESC`);
    }),

  getBySlug: publicProcedure
    .input(z.object({ citySlug: z.string(), eventSlug: z.string() }))
    .query(async ({ input }) => getEventBySlug(input.citySlug, input.eventSlug)),

  getFeatured: publicProcedure
    .input(z.object({ citySlug: z.string() }))
    .query(async ({ input }) => getFeaturedEvents(input.citySlug)),

  getSimilar: publicProcedure
    .input(z.object({ eventId: z.string(), category: z.string(), citySlug: z.string(), limit: z.number().optional() }))
    .query(async ({ input }) => getSimilarEvents(input.eventId, input.category, input.citySlug, input.limit ?? 3)),

  search: publicProcedure
    .input(z.object({
      query: z.string(),
      category: z.string().nullable().optional(),
      citySlug: z.string().optional(),
    }))
    .query(async ({ input }) => searchEvents(input.query, input.citySlug, input.category ?? undefined)),

  getCountByCity: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return {};

    const counts = await db
      .select({
        citySlug: events.citySlug,
        count: sql<number>`count(*)`,
      })
      .from(events)
      .groupBy(events.citySlug);

    return Object.fromEntries(
      counts.map((r) => [r.citySlug, Number(r.count)])
    );
  }),
});
