import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { upsertUser } from "@/server/db/index";

// Ensure all possible secret and URL variables are set for NextAuth v5
if (!process.env.AUTH_SECRET && process.env.NEXTAUTH_SECRET) {
  process.env.AUTH_SECRET = process.env.NEXTAUTH_SECRET;
}
if (!process.env.AUTH_URL && process.env.NEXTAUTH_URL) {
  process.env.AUTH_URL = process.env.NEXTAUTH_URL;
}

const authOptions = NextAuth({
  // Force trustHost to true for DuckDNS/Proxy environments
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/",
    error: "/auth-error",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      // Standard authorization params for Google
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
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
        // Return true to allow login even if DB update fails temporarily
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
    async redirect({ url, baseUrl }) {
      // Robust redirect handling for production
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  session: {
    strategy: "jwt",
  },
  // Enable debug logging to catch the exact error in PM2 logs
  debug: true,
});

export const GET = authOptions.handlers.GET;
export const POST = authOptions.handlers.POST;
export const auth = authOptions.auth;
