import { publicProcedure, protectedProcedure, router } from "../trpc";
import { z } from "zod";
import {
  getEventBySlug,
  getFeaturedEvents,
  getSimilarEvents,
  searchEvents,
  getDb,
  getCitiesFromDb,
  getCategoriesFromDb,
  createEvent,
} from "../db/index";
import { events, cities, categories } from "../db/schema";
import { sql } from "drizzle-orm";

type CityCountRow = {
  citySlug: string;
  count: number | string;
};

const dateEnum = z.enum(["all", "today", "tomorrow", "weekend", "week"]);

export const eventsRouter = router({
  getCities: publicProcedure.query(async () => {
    return getCitiesFromDb();
  }),

  getCategories: publicProcedure.query(async () => {
    return getCategoriesFromDb();
  }),

  getByCity: publicProcedure
    .input(
      z.object({
        citySlug: z.string(),
        category: z.string().optional(),
        search: z.string().optional(),
        date: dateEnum.optional(),
        price: z.string().optional(),
        sort: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return searchEvents(
        input.search ?? "",
        input.citySlug,
        input.category ?? undefined,
        input.date ?? undefined,
        input.price ?? undefined,
        input.sort ?? undefined,
      );
    }),

  getBySlug: publicProcedure
    .input(z.object({ citySlug: z.string(), eventSlug: z.string() }))
    .query(async ({ input }) => getEventBySlug(input.citySlug, input.eventSlug)),

  getFeatured: publicProcedure
    .input(z.object({ citySlug: z.string() }))
    .query(async ({ input }) => getFeaturedEvents(input.citySlug)),

  getSimilar: publicProcedure
    .input(
      z.object({
        eventId: z.string(),
        category: z.string(),
        citySlug: z.string(),
        limit: z.number().optional(),
      })
    )
    .query(async ({ input }) =>
      getSimilarEvents(input.eventId, input.category, input.citySlug, input.limit ?? 3)
    ),

  search: publicProcedure
    .input(
      z.object({
        query: z.string(),
        category: z.string().nullable().optional(),
        citySlug: z.string().optional(),
        date: dateEnum.optional(),
        price: z.string().optional(),
        sort: z.string().optional(),
      })
    )
    .query(async ({ input }) =>
      searchEvents(
        input.query,
        input.citySlug,
        input.category ?? undefined,
        input.date ?? undefined,
        input.price ?? undefined,
        input.sort ?? undefined,
      )
    ),

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
      (counts as CityCountRow[]).map((r: CityCountRow) => [r.citySlug, Number(r.count)])
    );
  }),

  create: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string().optional(),
        image: z.string().optional(),
        date: z.string(),
        time: z.string(),
        venue: z.string(),
        city: z.string(),
        citySlug: z.string(),
        category: z.string(),
        price: z.string().optional(),
        tags: z.string().optional(),
        slug: z.string(),
        organizerId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // In a real app, we'd verify the user is an organizer for this organizerId
      // For now, we'll use the role check from protectedProcedure/adminProcedure
      return createEvent({
        ...input,
        isFeatured: 0,
        interested: 0,
      });
    }),
});
