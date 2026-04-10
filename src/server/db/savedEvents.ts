import { and, desc, eq } from "drizzle-orm";
import { savedEvents, events as eventsTable } from "./schema";
import { getDb } from "./client";

const eventFields = (e: typeof eventsTable) => ({
  id: e.id, title: e.title, description: e.description, image: e.image,
  date: e.date, time: e.time, venue: e.venue, city: e.city,
  citySlug: e.citySlug, category: e.category, price: e.price,
  interested: e.interested, tags: e.tags, slug: e.slug,
  isFeatured: e.isFeatured, createdAt: e.createdAt, updatedAt: e.updatedAt,
});

export async function saveEvent(
  userId: number, eventId: string, eventTitle: string,
  eventDate: string, eventCity: string,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(savedEvents)
    .where(and(eq(savedEvents.userId, userId), eq(savedEvents.eventId, eventId))).limit(1);
  if (existing.length > 0) return existing[0];
  await db.insert(savedEvents).values({ userId, eventId, eventTitle, eventDate, eventCity });
  return { userId, eventId, eventTitle, eventDate, eventCity };
}

export async function unsaveEvent(userId: number, eventId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(savedEvents)
    .where(and(eq(savedEvents.userId, userId), eq(savedEvents.eventId, eventId)));
  return { success: true };
}

export async function getUserSavedEvents(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select({
    id: savedEvents.id, userId: savedEvents.userId,
    eventId: savedEvents.eventId, savedAt: savedEvents.savedAt,
    event: eventFields(eventsTable),
  })
  .from(savedEvents)
  .leftJoin(eventsTable, eq(savedEvents.eventId, eventsTable.id))
  .where(eq(savedEvents.userId, userId))
  .orderBy(desc(savedEvents.savedAt));
}

export async function isEventSaved(userId: number, eventId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(savedEvents)
    .where(and(eq(savedEvents.userId, userId), eq(savedEvents.eventId, eventId))).limit(1);
  return result.length > 0;
}