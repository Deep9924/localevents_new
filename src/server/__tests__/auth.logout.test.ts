// src/server/routers/__tests__/auth.logout.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { COOKIE_NAME } from "@/lib/const";

// Must mock next/headers before importing the router
const mockCookieSet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    set: mockCookieSet,
  })),
}));

// Mock the DB so no real connection is needed
vi.mock("@/server/db/client", () => ({
  getDb: vi.fn(),
}));

import { appRouter } from "@/server/routers/root";
import type { Context } from "@/server/context";

function createCtx(user: Context["user"] = null): Context {
  return {
    user,
  } as Context;
}

const authenticatedUser: NonNullable<Context["user"]> = {
  id: 1,
  openId: "test-open-id",
  email: "test@example.com",
  name: "Test User",
  loginMethod: "email",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
  passwordHash: null,
};

describe("auth.logout", () => {
  beforeEach(() => {
    mockCookieSet.mockClear();
  });

  it("clears the session cookie and returns success when authenticated", async () => {
    const caller = appRouter.createCaller(createCtx(authenticatedUser));
    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(mockCookieSet).toHaveBeenCalledOnce();
    expect(mockCookieSet).toHaveBeenCalledWith(COOKIE_NAME, "", {
      maxAge: -1,
      path: "/",
    });
  });

  it("clears the session cookie and returns success when unauthenticated (already logged out)", async () => {
    const caller = appRouter.createCaller(createCtx(null));
    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(mockCookieSet).toHaveBeenCalledOnce();
    expect(mockCookieSet).toHaveBeenCalledWith(COOKIE_NAME, "", {
      maxAge: -1,
      path: "/",
    });
  });

  it("nulls out ctx.user after logout", async () => {
    const ctx = createCtx(authenticatedUser);
    const caller = appRouter.createCaller(ctx);
    await caller.auth.logout();

    expect(ctx.user).toBeNull();
  });
});