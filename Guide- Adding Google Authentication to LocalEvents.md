# Guide: Adding Google Authentication to LocalEvents

This guide outlines the steps to integrate Google OAuth into your project using **better-auth**, which is a modern, developer-friendly authentication library that works perfectly with Next.js and Drizzle ORM.

## 1. Prerequisites

1.  **Google Cloud Console**:
    -   Create a new project at [Google Cloud Console](https://console.cloud.google.com/).
    -   Go to **APIs & Services > OAuth consent screen**. Set it up as "External".
    -   Go to **APIs & Services > Credentials**. Create "OAuth 2.0 Client IDs".
    -   Add `http://localhost:3000` to **Authorized JavaScript origins**.
    -   Add `http://localhost:3000/api/auth/callback/google` to **Authorized redirect URIs**.
    -   Copy your **Client ID** and **Client Secret**.

2.  **Environment Variables**:
    Add these to your `.env` file:
    ```env
    GOOGLE_CLIENT_ID=your_client_id
    GOOGLE_CLIENT_SECRET=your_client_secret
    BETTER_AUTH_SECRET=your_random_secret_string
    BETTER_AUTH_URL=http://localhost:3000
    ```

## 2. Installation

Install the required packages:
```bash
npm install better-auth
```

## 3. Database Schema Update

Update your `src/server/db/schema.ts` to include the tables required by `better-auth`. It usually needs `users`, `sessions`, `accounts`, and `verifications`.

```typescript
// Add these to src/server/db/schema.ts
export const sessions = mysqlTable("sessions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  token: varchar("token", { length: 255 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const accounts = mysqlTable("accounts", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  accountId: varchar("accountId", { length: 255 }).notNull(),
  providerId: varchar("providerId", { length: 255 }).notNull(),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  expiresAt: timestamp("expiresAt"),
  password: text("password"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
```

## 4. Auth Configuration

Create a file `src/lib/auth.ts` to configure `better-auth`:

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/server/db";
import * as schema from "@/server/db/schema";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "mysql",
        schema: schema,
    }),
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
    },
});
```

## 5. API Route

Create `src/app/api/auth/[...all]/route.ts` to handle auth requests:

```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

## 6. Client-Side Integration

Update your `useAuth` hook or create a login button:

```tsx
import { authClient } from "@/lib/auth-client"; // You'll need to create this

const loginWithGoogle = async () => {
    await authClient.signIn.social({
        provider: "google",
        callbackURL: "/toronto",
    });
};

// In your component:
<Button onClick={loginWithGoogle}>
    Sign in with Google
</Button>
```

## 7. Migration

Run your database migration to apply the new tables:
```bash
npm run db:push
```

---

### Why Better-Auth?
- **Type Safety**: Built-in TypeScript support.
- **Drizzle Native**: First-class support for Drizzle ORM.
- **Easy Socials**: One-line configuration for Google, GitHub, etc.
- **Modern**: Designed specifically for the Next.js App Router.
