import { and, desc, eq, gte, lte, ne, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { events as eventsTable } from "./schema";
import { getDb } from "./client";

export async function getEventsByCity(citySlug: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(eventsTable).where(eq(eventsTable.citySlug, citySlug))
    .orderBy(desc(eventsTable.isFeatured), desc(eventsTable.createdAt));
}

export async function getEventBySlug(citySlug: string, eventSlug: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(eventsTable)
    .where(and(eq(eventsTable.citySlug, citySlug), eq(eventsTable.slug, eventSlug))).limit(1);
  return result[0] ?? null;
}

export async function getFeaturedEvents(citySlug: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(eventsTable)
    .where(and(eq(eventsTable.citySlug, citySlug), eq(eventsTable.isFeatured, 1)));
}

export async function getSimilarEvents(
  eventId: string, category: string, citySlug: string, limit = 8,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(eventsTable)
    .where(and(ne(eventsTable.id, eventId), eq(eventsTable.category, category), eq(eventsTable.citySlug, citySlug)))
    .limit(limit);
}

export async function searchEvents(
  query: string, citySlug?: string, category?: string,
  dateFilter?: string, priceFilter?: string, sortOption?: string, limit = 50,
) {
  const db = await getDb();
  if (!db) return [];

  const conditions: SQL[] = [];

  if (query) {
    const p = `%${query.toLowerCase()}%`;
    conditions.push(sql`LOWER(${eventsTable.title}) LIKE ${p}
      OR LOWER(${eventsTable.description}) LIKE ${p}
      OR LOWER(${eventsTable.venue}) LIKE ${p}`);
  }
  if (citySlug) conditions.push(eq(eventsTable.citySlug, citySlug));
  if (category && category !== "all") conditions.push(eq(eventsTable.category, category));

  if (dateFilter && dateFilter !== "any") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];
    if (dateFilter === "today") {
      conditions.push(eq(eventsTable.date, todayStr));
    } else if (dateFilter === "tomorrow") {
      const t = new Date(today);
      t.setDate(today.getDate() + 1);
      conditions.push(eq(eventsTable.date, t.toISOString().split("T")[0]));
    } else if (dateFilter === "week") {
      const w = new Date(today);
      w.setDate(today.getDate() + 7);
      conditions.push(gte(eventsTable.date, todayStr));
      conditions.push(lte(eventsTable.date, w.toISOString().split("T")[0]));
    } else if (dateFilter === "weekend") {
      const day = today.getDay();
      const daysUntilSat = day === 6 ? 7 : (6 - day + 7) % 7 || 7;
      const sat = new Date(today);
      sat.setDate(today.getDate() + daysUntilSat);
      const sun = new Date(sat);
      sun.setDate(sat.getDate() + 1);
      conditions.push(sql`${eventsTable.date} IN (${sat.toISOString().split("T")[0]}, ${sun.toISOString().split("T")[0]})`);
    }
  }

  if (priceFilter && priceFilter !== "any") {
    const castPrice = sql`CAST(REPLACE(${eventsTable.price}, 'CAD ', '') AS DECIMAL(10,2))`;
    if (priceFilter === "free") conditions.push(eq(eventsTable.price, "Free"));
    else if (priceFilter === "under20") conditions.push(sql`${castPrice} > 0 AND ${castPrice} < 20`);
    else if (priceFilter === "20to50") conditions.push(sql`${castPrice} >= 20 AND ${castPrice} <= 50`);
    else if (priceFilter === "50plus") conditions.push(sql`${castPrice} > 50`);
  }

  let order: SQL | typeof eventsTable.date | ReturnType<typeof desc> = desc(eventsTable.isFeatured);
  if (sortOption === "date-asc") order = eventsTable.date;
  else if (sortOption === "date-desc") order = desc(eventsTable.date);
  else if (sortOption === "price-asc") order = sql`CAST(REPLACE(${eventsTable.price}, 'CAD ', '') AS DECIMAL(10,2)) ASC`;
  else if (sortOption === "price-desc") order = sql`CAST(REPLACE(${eventsTable.price}, 'CAD ', '') AS DECIMAL(10,2)) DESC`;

  return db.select().from(eventsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(order)
    .limit(limit);
}