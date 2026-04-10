import { eq } from "drizzle-orm";
import { organizers, events as eventsTable } from "./schema";
import { getDb } from "./client";

export async function getOrganizerById(organizerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(organizers)
    .where(eq(organizers.id, organizerId)).limit(1);
  return result[0] ?? null;
}

export async function getOrganizerEvents(organizerId: number, limit = 5) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(eventsTable)
    .where(eq(eventsTable.organizerId, organizerId)).limit(limit);
}