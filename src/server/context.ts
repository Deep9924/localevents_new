// src/server/context.ts
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getUserByOpenId } from "./db/index";
import type { User } from "./db/schema";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export type TrpcContext = {
  user: User | null;
};

export async function createContext(): Promise<TrpcContext> {
  let user: User | null = null;

  // 1. Try NextAuth session — isolated so failures don't block the fallback
  try {
    const session = await auth();
    console.log("NextAuth session found:", !!session);
    const openId = session?.user?.id;
    if (openId) {
      user = (await getUserByOpenId(openId)) ?? null;
      console.log("User found via NextAuth:", !!user);
    }
  } catch (err) {
    console.error("NextAuth error:", err);
    // NextAuth misconfigured or unavailable — continue to cookie fallback
  }

  // 2. Cookie fallback — only runs if NextAuth didn't find a user
  if (!user) {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get("session")?.value;
      console.log("Cookie token found:", !!token);
      if (token) {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "fallback-secret");
        const { payload } = await jwtVerify(token, secret);
        console.log("JWT payload:", payload);
        if (payload.openId) {
          user = (await getUserByOpenId(payload.openId as string)) ?? null;
          console.log("User found:", !!user);
        }
      }
    } catch (err) {
      console.error("Cookie read error:", err);
    }
  }

  return { user };
}