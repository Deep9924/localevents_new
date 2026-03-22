// src/server/context.ts
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { getUserByOpenId } from "./db";
import type { User } from "./db/schema";

const COOKIE_NAME = "session";

export type TrpcContext = {
  user: User | null;
};

export async function createContext(): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;

    if (sessionCookie) {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "");
      const { payload } = await jwtVerify(sessionCookie, secret, {
        algorithms: ["HS256"],
      });

      const openId = payload.openId as string;
      if (openId) {
        user = await getUserByOpenId(openId) ?? null;
      }
    }
  } catch {
    user = null;
  }

  return { user };
}
