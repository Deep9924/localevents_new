import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { upsertUser } from "@/server/db/index";

const authOptions = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/", // Redirect to home page instead of non-existent /login page
    error: "/auth-error", // Redirect errors to a specific error page
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
      // Use the Google provider's account ID as the openId
      const openId = account?.providerAccountId || user.id;
      if (!openId) return false;
      
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
        // Return true anyway to allow login even if DB update fails temporarily, 
        // or return false to block. NextAuth v5 handles this via the error page.
        return false;
      }
    },
    async session({ session, token }) {
      // Set the user ID from the JWT token
      if (token.sub) {
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
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});

export const GET = authOptions.handlers.GET;
export const POST = authOptions.handlers.POST;
export const auth = authOptions.auth;
