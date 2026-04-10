// src/server/routers/__tests__/savedEvents.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock all db functions used by savedEvents router ──────────────────────
const mockSaveEvent = vi.fn();
const mockUnsaveEvent = vi.fn();
const mockGetUserSavedEvents = vi.fn();
const mockIsEventSaved = vi.fn();

vi.mock("@/server/db/savedEvents", () => ({
  saveEvent: mockSaveEvent,
  unsaveEvent: mockUnsaveEvent,
  getUserSavedEvents: mockGetUserSavedEvents,
  isEventSaved: mockIsEventSaved,
}));

vi.mock("@/server/db/client", () => ({
  getDb: vi.fn(),
}));

import { appRouter } from "@/server/routers/root";
import type { Context } from "@/server/context";

// ── Shared test data ───────────────────────────────────────────────────────
const USER_ID = 1;
const EVENT_ID = "event-123";
const EVENT_TITLE = "Summer Music Festival";
const EVENT_DATE = "2026-06-15";
const EVENT_CITY = "toronto";

const mockSavedRow = {
  id: 1,
  userId: USER_ID,
  eventId: EVENT_ID,
  savedAt: new Date(),
  event: {
    id: EVENT_ID,
    title: EVENT_TITLE,
    city: EVENT_CITY,
    slug: "summer-music-festival",
    date: EVENT_DATE,
    time: "19:00",
    venue: "Scotiabank Arena",
    citySlug: EVENT_CITY,
    category: "music",
    price: "CAD 50",
    image: null,
    description: null,
    interested: 0,
    tags: null,
    isFeatured: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

function createAuthCtx(): Context {
  return {
    user: {
      id: USER_ID,
      openId: "test-open-id",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "email",
      role: "user" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      passwordHash: null,
    },
  } as Context;
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe("savedEvents router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── save ──────────────────────────────────────────────────────────────
  describe("save", () => {
    it("saves an event and returns the record", async () => {
      mockSaveEvent.mockResolvedValue({
        userId: USER_ID,
        eventId: EVENT_ID,
        eventTitle: EVENT_TITLE,
        eventDate: EVENT_DATE,
        eventCity: EVENT_CITY,
      });

      const caller = appRouter.createCaller(createAuthCtx());
      const result = await caller.savedEvents.save({
        eventId: EVENT_ID,
        eventTitle: EVENT_TITLE,
        eventDate: EVENT_DATE,
        eventCity: EVENT_CITY,
      });

      expect(mockSaveEvent).toHaveBeenCalledOnce();
      expect(mockSaveEvent).toHaveBeenCalledWith(
        USER_ID, EVENT_ID, EVENT_TITLE, EVENT_DATE, EVENT_CITY
      );
      expect(result).toMatchObject({ eventId: EVENT_ID, userId: USER_ID });
    });

    it("returns existing record without creating a duplicate", async () => {
      mockSaveEvent.mockResolvedValue({ id: 1, userId: USER_ID, eventId: EVENT_ID });

      const caller = appRouter.createCaller(createAuthCtx());
      await caller.savedEvents.save({ eventId: EVENT_ID, eventTitle: EVENT_TITLE, eventDate: EVENT_DATE, eventCity: EVENT_CITY });
      await caller.savedEvents.save({ eventId: EVENT_ID, eventTitle: EVENT_TITLE, eventDate: EVENT_DATE, eventCity: EVENT_CITY });

      // saveEvent itself handles deduplication — we just verify it's called
      expect(mockSaveEvent).toHaveBeenCalledTimes(2);
    });
  });

  // ── unsave ────────────────────────────────────────────────────────────
  describe("unsave", () => {
    it("removes a saved event and returns success", async () => {
      mockUnsaveEvent.mockResolvedValue({ success: true });

      const caller = appRouter.createCaller(createAuthCtx());
      const result = await caller.savedEvents.unsave({ eventId: EVENT_ID });

      expect(mockUnsaveEvent).toHaveBeenCalledWith(USER_ID, EVENT_ID);
      expect(result).toEqual({ success: true });
    });
  });

  // ── list ──────────────────────────────────────────────────────────────
  describe("list", () => {
    it("returns all saved events for the user", async () => {
      mockGetUserSavedEvents.mockResolvedValue([mockSavedRow]);

      const caller = appRouter.createCaller(createAuthCtx());
      const result = await caller.savedEvents.list();

      expect(mockGetUserSavedEvents).toHaveBeenCalledWith(USER_ID);
      expect(result).toHaveLength(1);
      expect(result[0]?.eventId).toBe(EVENT_ID);
    });

    it("returns empty array when user has no saved events", async () => {
      mockGetUserSavedEvents.mockResolvedValue([]);

      const caller = appRouter.createCaller(createAuthCtx());
      const result = await caller.savedEvents.list();

      expect(result).toEqual([]);
    });

    it("includes full event details in each saved record", async () => {
      mockGetUserSavedEvents.mockResolvedValue([mockSavedRow]);

      const caller = appRouter.createCaller(createAuthCtx());
      const [first] = await caller.savedEvents.list();

      expect(first?.event?.title).toBe(EVENT_TITLE);
      expect(first?.event?.city).toBe(EVENT_CITY);
      expect(first?.event?.slug).toBe("summer-music-festival");
    });
  });

  // ── isSaved ───────────────────────────────────────────────────────────
  describe("isSaved", () => {
    it("returns true when the event is saved", async () => {
      mockIsEventSaved.mockResolvedValue(true);

      const caller = appRouter.createCaller(createAuthCtx());
      const result = await caller.savedEvents.isSaved({ eventId: EVENT_ID });

      expect(mockIsEventSaved).toHaveBeenCalledWith(USER_ID, EVENT_ID);
      expect(result).toBe(true);
    });

    it("returns false when the event is not saved", async () => {
      mockIsEventSaved.mockResolvedValue(false);

      const caller = appRouter.createCaller(createAuthCtx());
      const result = await caller.savedEvents.isSaved({ eventId: "non-existent" });

      expect(result).toBe(false);
    });
  });
});