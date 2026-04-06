import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { upsertUser } from "@/server/db/index";

const authOptions = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      const openId = account?.providerAccountId || user.id;
      if (!openId) return false;
      
      try {
        await upsertUser({
          openId: openId,
          name: user.name ?? null,
          email: user.email ?? null,
          loginMethod: "google",
          lastSignedIn: new Date(),
        });
        return true;
      } catch (error) {
        console.error("[Auth] Failed to upsert user:", error);
        return true;
      }
    },
    async session({ session, token }) {
      if (token.openId) {
        session.user.id = token.openId as string;
      } else if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, account, user }) {
      if (account?.providerAccountId) {
        token.openId = account.providerAccountId;
      }
      if (!token.openId && user?.id) {
        token.openId = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
  debug: true,
});

export const GET = authOptions.handlers.GET;
export const POST = authOptions.handlers.POST;
export const auth = authOptions.auth;
