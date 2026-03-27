// src/server/db.ts
import { db } from "./db"; // your Drizzle instance, e.g. from "./db/index.ts"
import { users } from "./db/schema";
import { eq } from "drizzle-orm";
import type { User } from "./db/schema";

export async function getUserByOpenId(openId: string): Promise<User | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result[0] ?? null;
}
