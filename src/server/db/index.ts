import { and, desc, eq, ne, like, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { events as eventsTable, users, savedEvents, organizers, cities as citiesTable, categories as categoriesTable } from "./schema";
import type { InsertUser } from "./schema";

type Db = ReturnType<typeof drizzle> | null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _db: any = null;

function buildPool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const parsed = new URL(url);

  return mysql.createPool({
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
    waitForConnections: true,
    connectionLimit: 10,
    ssl: { rejectUnauthorized: true },
  });
}

export async function getDb(): Promise<Db> {
  if (_db) return _db as Db;

  try {
    const pool = buildPool();
    _db = drizzle(pool) as unknown as Db;
    return _db as Db;
  } catch (error) {
    console.error("[Database] Failed to connect:", error);
    _db = null;
    return null;
  }
}

// ── Users ──────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;

    textFields.forEach((field) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    });

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }

    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === process.env.OWNER_OPEN_ID) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ── Saved Events ───────────────────────────────────────────────────────────

export async function saveEvent(userId: number, eventId: string, eventTitle: string, eventDate: string, eventCity: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(savedEvents)
    .where(and(eq(savedEvents.userId, userId), eq(savedEvents.eventId, eventId)))
    .limit(1);

  if (existing.length > 0) return existing[0];

  await db.insert(savedEvents).values({ userId, eventId, eventTitle, eventDate, eventCity });
  return { userId, eventId, eventTitle, eventDate, eventCity };
}

export async function unsaveEvent(userId: number, eventId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(savedEvents).where(and(eq(savedEvents.userId, userId), eq(savedEvents.eventId, eventId)));
  return { success: true };
}

export async function getUserSavedEvents(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select({
      id: savedEvents.id,
      userId: savedEvents.userId,
      eventId: savedEvents.eventId,
      savedAt: savedEvents.savedAt,
      event: {
        id: eventsTable.id,
        title: eventsTable.title,
        description: eventsTable.description,
        image: eventsTable.image,
        date: eventsTable.date,
        time: eventsTable.time,
        venue: eventsTable.venue,
        city: eventsTable.city,
        citySlug: eventsTable.citySlug,
        category: eventsTable.category,
        price: eventsTable.price,
        interested: eventsTable.interested,
        tags: eventsTable.tags,
        slug: eventsTable.slug,
        isFeatured: eventsTable.isFeatured,
        createdAt: eventsTable.createdAt,
        updatedAt: eventsTable.updatedAt,
      },
    })
    .from(savedEvents)
    .leftJoin(eventsTable, eq(savedEvents.eventId, eventsTable.id))
    .where(eq(savedEvents.userId, userId))
    .orderBy(desc(savedEvents.savedAt));
}

export async function isEventSaved(userId: number, eventId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .select()
    .from(savedEvents)
    .where(and(eq(savedEvents.userId, userId), eq(savedEvents.eventId, eventId)))
    .limit(1);
  return result.length > 0;
}

// ── Events ─────────────────────────────────────────────────────────────────

export async function getEventsByCity(citySlug: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(eventsTable)
    .where(eq(eventsTable.citySlug, citySlug))
    .orderBy(desc(eventsTable.isFeatured), desc(eventsTable.createdAt));
}

export async function getEventBySlug(citySlug: string, eventSlug: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .select()
    .from(eventsTable)
    .where(and(eq(eventsTable.citySlug, citySlug), eq(eventsTable.slug, eventSlug)))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getFeaturedEvents(citySlug: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(eventsTable)
    .where(and(eq(eventsTable.citySlug, citySlug), eq(eventsTable.isFeatured, 1)));
}

export async function getSimilarEvents(eventId: string, category: string, citySlug: string, limit = 3) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(eventsTable)
    .where(and(ne(eventsTable.id, eventId), eq(eventsTable.category, category), eq(eventsTable.citySlug, citySlug)))
    .limit(limit);
}

// ── Organizers ─────────────────────────────────────────────────────────────

export async function getOrganizerById(organizerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(organizers).where(eq(organizers.id, organizerId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getOrganizerEvents(organizerId: number, limit = 5) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(eventsTable).where(eq(eventsTable.organizerId, organizerId)).limit(limit);
}

// ── Search ─────────────────────────────────────────────────────────────────

export async function searchEvents(
  query: string,
  citySlug?: string,
  category?: string,
  dateFilter?: string,
  priceFilter?: string,
  sortOption?: string,
) {
  const db = await getDb();
  if (!db) return [];

  const conditions: any[] = [];

  if (query) {
    const searchPattern = `%${query.toLowerCase()}%`;
    conditions.push(sql`LOWER(${eventsTable.title}) LIKE ${searchPattern} OR LOWER(${eventsTable.description}) LIKE ${searchPattern} OR LOWER(${eventsTable.venue}) LIKE ${searchPattern}`);
  }
  if (citySlug) {
    conditions.push(eq(eventsTable.citySlug, citySlug));
  }
  if (category && category !== "all") {
    conditions.push(eq(eventsTable.category, category));
  }

  // Date filtering
  if (dateFilter && dateFilter !== "any") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    if (dateFilter === "today") {
      conditions.push(eq(eventsTable.date, todayStr));
    } else if (dateFilter === "tomorrow") {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      conditions.push(eq(eventsTable.date, tomorrow.toISOString().split("T")[0]));
    } else if (dateFilter === "week") {
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      conditions.push(gte(eventsTable.date, todayStr), lte(eventsTable.date, nextWeek.toISOString().split("T")[0]));
    } else if (dateFilter === "weekend") {
      // This is more complex as it requires checking day of week, might be better handled client-side or with a more advanced SQL function
      // For now, we'll leave it as a client-side filter if not directly supported by Drizzle/SQL
    }
  }

  // Price filtering
  if (priceFilter && priceFilter !== "any") {
    if (priceFilter === "free") {
      conditions.push(eq(eventsTable.price, "Free"));
    } else if (priceFilter === "under20") {
      conditions.push(sql`CAST(REPLACE(${eventsTable.price}, 'CAD ', '') AS DECIMAL(10, 2)) > 0 AND CAST(REPLACE(${eventsTable.price}, 'CAD ', '') AS DECIMAL(10, 2)) < 20`);
    } else if (priceFilter === "20to50") {
      conditions.push(sql`CAST(REPLACE(${eventsTable.price}, 'CAD ', '') AS DECIMAL(10, 2)) >= 20 AND CAST(REPLACE(${eventsTable.price}, 'CAD ', '') AS DECIMAL(10, 2)) <= 50`);
    } else if (priceFilter === "50plus") {
      conditions.push(sql`CAST(REPLACE(${eventsTable.price}, 'CAD ', '') AS DECIMAL(10, 2)) > 50`);
    }
  }

  let orderByClause: any = desc(eventsTable.isFeatured);
  if (sortOption) {
    switch (sortOption) {
      case "date-asc":
        orderByClause = eventsTable.date;
        break;
      case "date-desc":
        orderByClause = desc(eventsTable.date);
        break;
      case "price-asc":
        orderByClause = sql`CAST(REPLACE(${eventsTable.price}, 'CAD ', '') AS DECIMAL(10, 2)) ASC`;
        break;
      case "price-desc":
        orderByClause = sql`CAST(REPLACE(${eventsTable.price}, 'CAD ', '') AS DECIMAL(10, 2)) DESC`;
        break;
      case "relevance":
      default:
        orderByClause = desc(eventsTable.isFeatured);
        break;
    }
  }

  return db
    .select()
    .from(eventsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(orderByClause)
    .limit(20);
}

export async function getCitiesFromDb() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(citiesTable).orderBy(citiesTable.name);
}

export async function getCategoriesFromDb() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categoriesTable).orderBy(categoriesTable.label);
}
