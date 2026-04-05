// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { upsertUser } from "@/server/db/index";

const authOptions = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.id) return false;
      await upsertUser({
        openId: user.id,
        name: user.name ?? null,
        email: user.email ?? null,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });
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

export const GET = authOptions.handlers.GET;
export const POST = authOptions.handlers.POST;
export const auth = authOptions.auth;
