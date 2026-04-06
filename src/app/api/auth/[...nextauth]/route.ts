import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { upsertUser } from "@/server/db/index";

const authOptions = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  // Use standard pages
  pages: {
    signIn: "/",
    error: "/auth-error",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      // Explicitly set the authorization endpoint to ensure correct redirect
      authorization: {
        params: {
          prompt: "consent",
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
      
      // Use the Google provider's account ID as the openId
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
        // Return true to allow login even if DB update fails temporarily
        // This prevents the redirect to /api/auth/error if it's just a DB issue
        return true;
      }
    },
    async session({ session, token }) {
      // Set the user ID from the JWT token
      if (token.openId) {
        session.user.id = token.openId as string;
      } else if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, account, user }) {
      // Store the provider account ID in the JWT token
      if (account?.providerAccountId) {
        token.openId = account.providerAccountId;
      }
      // Fallback to user.id if available
      if (!token.openId && user?.id) {
        token.openId = user.id;
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      // Robust redirect handling for production
      console.log("[Auth] Redirecting:", { url, baseUrl });
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Add debug logging for production to catch the exact error
  debug: true,
});

export const GET = authOptions.handlers.GET;
export const POST = authOptions.handlers.POST;
export const auth = authOptions.auth;
