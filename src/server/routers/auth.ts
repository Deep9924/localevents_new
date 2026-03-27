import { publicProcedure, router } from "../trpc";
import { z } from "zod";
import { getDb } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export const authRouter = router({
  me: publicProcedure.query((opts) => opts.ctx.user ?? null),

  logout: publicProcedure.mutation(({ ctx }) => {
    return { success: true } as const;
  }),

  signup: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[a-z]/, "Must contain lowercase letters")
        .regex(/[A-Z]/, "Must contain uppercase letters")
        .regex(/[0-9]/, "Must contain numbers")
        .regex(/[^a-zA-Z0-9]/, "Must contain special characters"),
      name: z.string().min(2),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (existing.length > 0) throw new Error("Email already registered");

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
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (result.length === 0) throw new Error("Invalid email or password");

      const user = result[0];
      if (!user.passwordHash || hashPassword(input.password) !== user.passwordHash) {
        throw new Error("Invalid email or password");
      }

      await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));

      // ✅ Return openId + name so the client can call set-session to write the cookie
      return {
        success: true,
        openId: user.openId,
        name: user.name ?? user.email,
        user: { id: user.id, email: user.email, name: user.name },
      };
    }),
});
