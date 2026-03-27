// src/server/db.ts
import { db } from "./db"; // your Drizzle instance
import { savedEvents, users } from "./db/schema";
import { eq } from "drizzle-orm";

export async function saveEvent(userId: number, eventId: string) {
  return db.insert(savedEvents).values({
    userId,
    eventId,
    savedAt: new Date(),
  }).execute();
}

export async function unsaveEvent(userId: number, eventId: string) {
  return db
    .delete(savedEvents)
    .where(
      and(
        eq(savedEvents.userId, userId),
        eq(savedEvents.eventId, eventId)
      )
    )
    .execute();
}

export async function getUserSavedEvents(userId: number) {
  return db
    .select()
    .from(savedEvents)
    .where(eq(savedEvents.userId, userId));
}

export async function isEventSaved(userId: number, eventId: string) {
  const result = await db
    .select({ id: savedEvents.id })
    .from(savedEvents)
    .where(
      and(
        eq(savedEvents.userId, userId),
        eq(savedEvents.eventId, eventId)
      )
    )
    .limit(1);

  return result.length > 0;
}
