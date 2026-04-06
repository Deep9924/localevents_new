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

  try {
    // 1. Try NextAuth session
    const session = await auth();
    const openId = session?.user?.id;
    if (openId) {
      user = (await getUserByOpenId(openId)) ?? null;
    }

    // 2. Fallback to legacy session cookie if NextAuth fails
    if (!user) {
      const cookieStore = await cookies();
      const token = cookieStore.get("session")?.value;
      if (token) {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "fallback-secret");
        const { payload } = await jwtVerify(token, secret);
        if (payload.openId) {
          user = (await getUserByOpenId(payload.openId as string)) ?? null;
        }
      }
    }
  } catch (err) {
    console.error("Failed to read session:", err);
    user = null;
  }

  return { user };
}
