import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { upsertUser, getDb, getUserByEmail } from "@/server/db/index";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export const config = {
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string() })
          .safeParse(credentials);

        if (!parsedCredentials.success) return null;

        const { email, password } = parsedCredentials.data;

        const user = await getUserByEmail(email);
        if (!user) return null;

        if (user.loginMethod === "google") {
          throw new Error("This account uses Google sign-in. Please sign in with Google.");
        }

        if (!user.passwordHash) return null;

        const bcryptValid = await verifyPassword(password, user.passwordHash);

        if (!bcryptValid) {
          // Legacy fallback: accounts created with old SHA-256 system
          const legacyHash = crypto
            .createHash("sha256")
            .update(password)
            .digest("hex");

          if (user.passwordHash === legacyHash) {
            // Upgrade to bcrypt silently — only happens once per legacy user
            const newHash = await hashPassword(password);
            const db = await getDb();
            if (db) {
              await db
                .update(users)
                .set({ passwordHash: newHash })
                .where(eq(users.id, user.id));
            }
          } else {
            return null;
          }
        }

        const db = await getDb();
        if (db) {
          await db
            .update(users)
            .set({ lastSignedIn: new Date() })
            .where(eq(users.id, user.id));
        }

        return {
          id: user.openId ?? `local-${user.id}`,
          name: user.name ?? user.email,
          email: user.email,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const openId = account?.providerAccountId ?? user.id;
        if (!openId || !user.email) return false;

        try {
          const db = await getDb();
          if (!db) return false;

          const existing = await db
            .select()
            .from(users)
            .where(eq(users.email, user.email))
            .limit(1);

          if (existing.length > 0 && existing[0].loginMethod !== "google") {
            return "/api/auth/error?error=OAuthAccountNotLinked";
          }

          await upsertUser({
            openId,
            name: user.name ?? null,
            email: user.email ?? null,
            loginMethod: "google",
            lastSignedIn: new Date(),
          });
        } catch (err) {
          console.error("Failed to upsert user:", err);
          return false;
        }
      } else if (account?.provider === "credentials") {
        // Credentials provider handles its own user validation in authorize()
        return true;
      }
      return true;
    },

    async jwt({ token, account }) {
      if (account?.providerAccountId) {
        token.openId = account.providerAccountId;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        if (token.openId) {
          session.user.id = token.openId as string;
        } else if (token.sub) {
          session.user.id = token.sub;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(config);
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      const openId = account?.providerAccountId ?? user.id;
      if (!openId || !user.email) return false;

      try {
        const db = await getDb();
        if (!db) return false;

        const existing = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email))
          .limit(1);

        if (existing.length > 0 && existing[0].loginMethod !== "google") {
          return "/api/auth/error?error=OAuthAccountNotLinked";
        }

        await upsertUser({
          openId,
          name: user.name ?? null,
          email: user.email ?? null,
          loginMethod: "google",
          lastSignedIn: new Date(),
        });
      } catch (err) {
        console.error("Failed to upsert user:", err);
        return false;
      }

      return true;
    },

    async jwt({ token, account }) {
      if (account?.providerAccountId) {
        token.openId = account.providerAccountId;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        if (token.openId) {
          session.user.id = token.openId as string;
        } else if (token.sub) {
          session.user.id = token.sub;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});