// src/server/routers.ts
import { publicProcedure, protectedProcedure, router } from "./trpc";
import { z } from "zod";
import {
  saveEvent, unsaveEvent, getUserSavedEvents, isEventSaved,
  getEventsByCity, getEventBySlug, getFeaturedEvents,
  getSimilarEvents, getOrganizerById, getOrganizerEvents, searchEvents,
  getDb,
} from "./db";
import { users, events } from "./db/schema";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export const appRouter = router({
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user ?? null),

    logout: publicProcedure.mutation(({ ctx }) => {
      return { success: true } as const;
    }),

    signup: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string()
          .min(8, "Password must be at least 8 characters")
          .regex(/[a-z]/, "Must contain lowercase letters")
          .regex(/[A-Z]/, "Must contain uppercase letters")
          .regex(/[0-9]/, "Must contain numbers")
          .regex(/[^a-zA-Z0-9]/, "Must contain special characters"),
        name: z.string().min(2),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
        if (existing.length > 0) throw new Error("Email already registered");

        await db.insert(users).values({
          email: input.email,
          name: input.name,
          passwordHash: hashPassword(input.password),
          openId: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          lastSignedIn: new Date(),
          role: "user",
        });

        return { success: true, message: "Account created successfully" };
      }),

    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
        if (result.length === 0) throw new Error("Invalid email or password");

        const user = result[0];
        if (!user.passwordHash || hashPassword(input.password) !== user.passwordHash) {
          throw new Error("Invalid email or password");
        }

        await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));

        return {
          success: true,
          user: { id: user.id, email: user.email, name: user.name },
        };
      }),
  }),

  events: router({
    getByCity: publicProcedure
      .input(z.object({ citySlug: z.string() }))
      .query(async ({ input }) => getEventsByCity(input.citySlug)),

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

    // ✅ Added — event counts per city for CityPickerModal
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
  }),

  organizers: router({
    getById: publicProcedure
      .input(z.object({ organizerId: z.number() }))
      .query(async ({ input }) => getOrganizerById(input.organizerId)),

    getEvents: publicProcedure
      .input(z.object({ organizerId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => getOrganizerEvents(input.organizerId, input.limit ?? 5)),
  }),

  savedEvents: router({
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
  }),
});

export type AppRouter = typeof appRouter;
