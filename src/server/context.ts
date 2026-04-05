// src/server/context.ts
import { auth } from "@/app/api/auth/[...nextauth]/route";
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
    console.error("Failed to read session:", err);
    user = null;
  }

  return { user };
}
