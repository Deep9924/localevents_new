// src/server/context.ts
import { auth } from "@/auth";
import { getUserByOpenId } from "./db/index";
import type { User } from "./db/schema";

export type TrpcContext = {
  user: User | null;
};

export async function createContext(): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const session = await auth();
    const openId = session?.user?.id;
    if (openId) {
      user = (await getUserByOpenId(openId)) ?? null;
    }
  } catch (err) {
    console.error("NextAuth error:", err);
  }

  return { user };
}
