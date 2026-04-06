import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { upsertUser } from "@/server/db/index";

const authOptions = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  debug: process.env.NODE_ENV !== "production", // Enable debug logs in dev
  pages: {
    signIn: "/",
    error: "/auth-error",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      issuer: "https://accounts.google.com",
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      console.log("[Auth] signIn callback triggered", { 
        provider: account?.provider,
        email: user.email 
      });
      
      const openId = account?.providerAccountId || user.id;
      if (!openId) {
        console.error("[Auth] No openId found in signIn callback");
        return false;
      }
      
      try {
        console.log("[Auth] Upserting user:", { openId, email: user.email });
        await upsertUser({
          openId: openId,
          name: user.name ?? null,
          email: user.email ?? null,
          loginMethod: "google",
          lastSignedIn: new Date(),
        });
        console.log("[Auth] User upserted successfully");
        return true;
      } catch (error) {
        console.error("[Auth] Failed to upsert user:", error);
        // In production, we might want to allow login even if DB update fails
        // but for debugging, we return false to see the error page
        return false;
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
      // Log redirects to debug production URL issues
      console.log("[Auth] Redirecting:", { url, baseUrl });
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  logger: {
    error(code, metadata) {
      console.error("[Auth Error]", code, metadata);
    },
    warn(code) {
      console.warn("[Auth Warning]", code);
    },
    debug(code, metadata) {
      console.log("[Auth Debug]", code, metadata);
    },
  },
});

export const GET = authOptions.handlers.GET;
export const POST = authOptions.handlers.POST;
export const auth = authOptions.auth;
