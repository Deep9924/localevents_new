import { drizzle } from "drizzle-orm/mysql2";  // ← must be mysql2, not mysql-core
import mysql, { Pool } from "mysql2/promise";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function buildPool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const parsed = new URL(url);
  return mysql.createPool({
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^//, ""),
    waitForConnections: true,
    connectionLimit: 10,
    ssl: { rejectUnauthorized: true },
  });
}

export async function getDb() {
  if (_db) return _db;
  try {
    _db = drizzle(buildPool(), { schema });
    return _db;
  } catch (error) {
    console.error("[Database] Failed to connect:", error);
    return null;
  }
}
