import { publicProcedure, router } from "../trpc";
import { z } from "zod";
import { getDb, getUserByEmail } from "../db/index";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";

export const authRouter = router({
  me: publicProcedure.query(({ ctx }) => ctx.user ?? null),

  checkEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const user = await getUserByEmail(input.email);
      if (!user) return { exists: false, loginMethod: null };
      return { exists: true, loginMethod: user.loginMethod };
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

      const existing = await getUserByEmail(input.email);
      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email already registered.",
        });
      }

      const passwordHash = await bcrypt.hash(input.password, 12);

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
});
