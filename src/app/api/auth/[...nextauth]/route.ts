// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { upsertUser } from "@/server/db/index";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.id) return false;
      try {
        await upsertUser({
          openId: user.id,
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
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, account }) {
      if (account?.providerAccountId) {
        token.openId = account.providerAccountId;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;