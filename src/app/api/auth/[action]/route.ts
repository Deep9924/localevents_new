// app/api/auth/[action]/route.ts
// Handles login/logout cookie setting — replaces Express cookie logic
import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

const COOKIE_NAME = "session";
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

// POST /api/auth/set-session — called after successful login
export async function POST(
  req: NextRequest,
  { params }: { params: { action: string } }
) {
  const { action } = params;

  if (action === "set-session") {
    const { openId, name } = await req.json();
    const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "");
    const token = await new SignJWT({ openId, name, appId: "localevents" })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(Math.floor((Date.now() + ONE_YEAR_MS) / 1000))
      .sign(secret);

    const res = NextResponse.json({ success: true });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: ONE_YEAR_MS / 1000,
      path: "/",
    });
    return res;
  }

  if (action === "logout") {
    const res = NextResponse.json({ success: true });
    res.cookies.set(COOKIE_NAME, "", { maxAge: -1, path: "/" });
    return res;
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
