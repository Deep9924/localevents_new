import { getDb } from "./client";
import { taxRates } from "./schema";
import { eq } from "drizzle-orm";
import type { TaxRate } from "./schema";

export async function getTaxRateByProvince(
  provinceCode: string
): Promise<TaxRate | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(taxRates)
    .where(eq(taxRates.provinceCode, provinceCode.toUpperCase()))
    .limit(1);

  return result[0] ?? null;
}

export async function getAllTaxRates(): Promise<TaxRate[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(taxRates).where(eq(taxRates.isActive, 1));
}