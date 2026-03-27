import { publicProcedure, router } from "../trpc";
import { z } from "zod";
import { getDb } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { SignJWT } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "session";
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function createSessionCookie(openId: string, name: string) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "fallback-secret");
  const token = await new SignJWT({ openId, name, appId: "localevents" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(Math.floor((Date.now() + ONE_YEAR_MS) / 1000))
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ONE_YEAR_MS / 1000,
    path: "/",
  });
}

export const authRouter = router({
  me: publicProcedure.query((opts) => opts.ctx.user ?? null),

  logout: publicProcedure.mutation(async () => {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, "", { maxAge: -1, path: "/" });
    return { success: true } as const;
  }),

  signup: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string()
          .min(8, "Password must be at least 8 characters")
          .regex(/[a-z]/, "Must contain lowercase letters")
          .regex(/[A-Z]/, "Must contain uppercase letters")
          .regex(/[0-9]/, "Must contain numbers")
          .regex(/[^a-zA-Z0-9]/, "Must contain special characters"),
        name: z.string().min(2),
      }),
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (existing.length > 0)
        throw new Error("Email already registered");

      await db.insert(users).values({
        email: input.email,
        name: input.name,
        passwordHash: hashPassword(input.password),
        openId: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        lastSignedIn: new Date(),
        role: "user",
      });

      return { success: true, message: "Account created successfully" };
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (result.length === 0)
        throw new Error("Invalid email or password");

      const user = result[0];

      if (!user.passwordHash || hashPassword(input.password) !== user.passwordHash) {
        throw new Error("Invalid email or password");
      }

      await db
        .update(users)
        .set({ lastSignedIn: new Date() })
        .where(eq(users.id, user.id));

      // Since `name` is nullable in the schema, but we always have an email fallback,
      // we assert that the result is a string.
      const openId: string = user.openId ?? `local-${user.id}`;
      const name: string = (user.name ?? user.email) as string;
      await createSessionCookie(openId, name);

      return {
        success: true,
        user: { id: user.id, email: user.email, name: user.name },
      };
    }),
});
