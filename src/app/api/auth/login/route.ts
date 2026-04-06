import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/server/db/index";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { SignJWT } from "jose";

const COOKIE_NAME = "session";
const ONE_YEAR_S  = 365 * 24 * 60 * 60;

function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const db = await getDb();
  if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user   = result[0];

  if (!user || user.loginMethod === "google" || hashPassword(password) !== user.passwordHash) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));

  const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "fallback-secret");
  const token  = await new SignJWT({
    openId: user.openId ?? `local-${user.id}`,
    name:   user.name ?? user.email,
    appId:  "localevents",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(Math.floor((Date.now() + ONE_YEAR_S * 1000) / 1000))
    .sign(secret);

  const res = NextResponse.json({
    success: true,
    user: { id: user.id, email: user.email, name: user.name },
  });

  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   ONE_YEAR_S,
    path:     "/",
  });

  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
  return res;
}