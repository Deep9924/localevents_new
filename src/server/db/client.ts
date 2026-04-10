import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

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
    database: parsed.pathname.slice(1),
    waitForConnections: true,
    connectionLimit: 10,
    ssl: { rejectUnauthorized: true },
  });
}

export async function getDb() {
  if (_db) return _db as ReturnType<typeof drizzle<typeof schema>>;
  try {
    _db = drizzle(buildPool(), { schema, mode: "default" });  // ← add mode
    return _db as ReturnType<typeof drizzle<typeof schema>>;
  } catch (error) {
    console.error("[Database] Failed to connect:", error);
    return null;
  }
}
