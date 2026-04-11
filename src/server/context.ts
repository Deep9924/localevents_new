// src/server/context.ts
import { auth } from "@/auth";
import { getUserByOpenId } from "./db/index";
import type { User } from "./db/schema";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { createSessionCookie, REFRESH_THRESHOLD_SEC, COOKIE_NAME } from "./routers/auth";

export type TrpcContext = {
  user: User | null;
};

export async function createContext(): Promise<TrpcContext> {
  let user: User | null = null;

  // 1. Try NextAuth session — isolated so failures don't block the fallback
  try {
    const session = await auth();
    const openId = session?.user?.id;
    if (openId) {
      user = (await getUserByOpenId(openId)) ?? null;
    }
  } catch (err) {
    console.error("NextAuth error:", err);
    // NextAuth misconfigured or unavailable — continue to cookie fallback
  }

  // 2. Cookie fallback — only runs if NextAuth didn't find a user
  if (!user) {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get(COOKIE_NAME)?.value;

      if (token) {
        const secret = new TextEncoder().encode(
          process.env.JWT_SECRET ?? "fallback-secret"
        );
        const { payload } = await jwtVerify(token, secret);

        if (payload.openId) {
          user = (await getUserByOpenId(payload.openId as string)) ?? null;

          // Roll the session forward if expiring within 24 hours
          if (user) {
            const expiresAt = payload.exp ?? 0;
            const secondsLeft = expiresAt - Math.floor(Date.now() / 1000);
            if (secondsLeft < REFRESH_THRESHOLD_SEC) {
              await createSessionCookie(
                payload.openId as string,
                payload.name as string
              );
            }
          }
        }
      }
    } catch (err) {
      console.error("Cookie auth error:", err);
    }
  }

  return { user };
}