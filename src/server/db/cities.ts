import { eq } from "drizzle-orm";
import { cities as citiesTable, categories as categoriesTable } from "./schema";
import { getDb } from "./client";

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

export async function getCityBySlug(slug: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db.select().from(citiesTable).where(eq(citiesTable.slug, slug)).limit(1);
  return rows[0] ?? null;
}