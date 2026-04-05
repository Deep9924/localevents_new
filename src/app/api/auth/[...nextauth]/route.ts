// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { upsertUser, getUserByOpenId } from "@/server/db/index";

const { handlers, auth } = NextAuth({
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
      // Attach openId and DB user id to session
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, account }) {
      // Store provider account id on first sign-in
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

export { handlers as GET, handlers as POST };
export { auth };
