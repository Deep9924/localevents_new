// src/server/routers/auth.ts
import { publicProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db/index";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { COOKIE_NAME } from "@/lib/const";

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
const SESSION_DURATION_SEC = SESSION_DURATION_MS / 1000;
const REFRESH_THRESHOLD_SEC = 24 * 60 * 60;

function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 12);
}

function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

async function createSessionCookie(openId: string, name: string) {
  const secret = new TextEncoder().encode(
    process.env.JWT_SECRET ?? "fallback-secret"
  );
  const token = await new SignJWT({ openId, name, appId: "localevents" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + SESSION_DURATION_MS) / 1000))
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_SEC,
    path: "/",
  });
}

export { createSessionCookie, REFRESH_THRESHOLD_SEC, COOKIE_NAME, SESSION_DURATION_MS };

export const authRouter = router({
  me: publicProcedure.query((opts) => opts.ctx.user ?? null),

  checkEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db
        .select({ loginMethod: users.loginMethod })
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);
      if (result.length === 0) return { exists: false, loginMethod: null };
      return { exists: true, loginMethod: result[0].loginMethod };
    }),

  logout: publicProcedure.mutation(async (opts) => {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, "", { maxAge: -1, path: "/" });
    opts.ctx.user = null;
    return { success: true } as const;
  }),

  signup: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z
          .string()
          .min(8, "Password must be at least 8 characters")
          .regex(/[a-z]/, "Must contain lowercase letters")
          .regex(/[A-Z]/, "Must contain uppercase letters")
          .regex(/[0-9]/, "Must contain numbers")
          .regex(/[^a-zA-Z0-9]/, "Must contain special characters"),
        name: z.string().min(2),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (existing.length > 0) {
        const existingUser = existing[0];
        if (existingUser.loginMethod === "google") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This email is registered with Google. Please sign in with Google.",
          });
        }
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email already registered.",
        });
      }

      const passwordHash = hashPassword(input.password);

      await db.insert(users).values({
        email: input.email,
        name: input.name,
        passwordHash,
        openId: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        loginMethod: "email",
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
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (result.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid email or password." });
      }

      const user = result[0];

      if (user.loginMethod === "google") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This account uses Google sign-in. Please sign in with Google.",
        });
      }

      if (!user.passwordHash) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid email or password." });
      }

      const bcryptValid = verifyPassword(input.password, user.passwordHash);

      if (!bcryptValid) {
        // Legacy fallback: accounts created with old SHA-256 system
        const legacyHash = crypto
          .createHash("sha256")
          .update(input.password)
          .digest("hex");

        if (user.passwordHash === legacyHash) {
          // Upgrade to bcrypt silently — only happens once per legacy user
          const newHash = hashPassword(input.password);
          await db
            .update(users)
            .set({ passwordHash: newHash })
            .where(eq(users.id, user.id));
        } else {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid email or password." });
        }
      }

      await db
        .update(users)
        .set({ lastSignedIn: new Date() })
        .where(eq(users.id, user.id));

      const openId: string = user.openId ?? `local-${user.id}`;
      const name: string = (user.name ?? user.email) as string;
      await createSessionCookie(openId, name);

      return {
        success: true,
        user: { id: user.id, email: user.email, name: user.name },
      };
    }),
});