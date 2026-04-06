import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { upsertUser } from "@/server/db/index";

const authOptions = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/",
    error: "/auth-error",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      // NextAuth v5 handles the authorization endpoint automatically
      // but we can ensure the prompt is set correctly
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      console.log("[Auth] signIn callback triggered", { 
        provider: account?.provider,
        email: user.email 
      });
      
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
        // Allow login even if DB fails to prevent redirect to error page
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
