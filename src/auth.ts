import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { upsertUser, getDb } from "@/server/db/index";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
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