import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { upsertUser } from "@/server/db/index";

// Ensure AUTH_URL is correctly set for NextAuth v5
if (!process.env.AUTH_URL && process.env.NEXTAUTH_URL) {
  process.env.AUTH_URL = process.env.NEXTAUTH_URL;
}

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
      // Standard issuer for Google
      issuer: "https://accounts.google.com",
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Use the Google provider's account ID as the openId
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
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});

export const GET = authOptions.handlers.GET;
export const POST = authOptions.handlers.POST;
export const auth = authOptions.auth;
