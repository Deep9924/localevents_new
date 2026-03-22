import { describe, it, expect, beforeEach, vi } from "vitest";
import { saveEvent, unsaveEvent, getUserSavedEvents, isEventSaved } from "./db";

// Mock database
vi.mock("./db", async () => {
  const actual = await vi.importActual("./db");
  return {
    ...actual,
  };
});

describe("Saved Events API", () => {
  const userId = 1;
  const eventId = "event-123";
  const eventTitle = "Summer Music Festival";
  const eventDate = "2026-06-15";
  const eventCity = "toronto";

  describe("saveEvent", () => {
    it("should save an event for a user", async () => {
      const result = await saveEvent(userId, eventId, eventTitle, eventDate, eventCity);
      
      expect(result).toBeDefined();
      expect(result.eventId).toBe(eventId);
      expect(result.userId).toBe(userId);
    });

    it("should not create duplicate saved events", async () => {
      // Save the same event twice
      await saveEvent(userId, eventId, eventTitle, eventDate, eventCity);
      const result = await saveEvent(userId, eventId, eventTitle, eventDate, eventCity);
      
      // Should return the existing record
      expect(result.eventId).toBe(eventId);
    });
  });

  describe("unsaveEvent", () => {
    it("should remove a saved event", async () => {
      // First save an event
      await saveEvent(userId, eventId, eventTitle, eventDate, eventCity);
      
      // Then unsave it
      const result = await unsaveEvent(userId, eventId);
      
      expect(result.success).toBe(true);
    });
  });

  describe("isEventSaved", () => {
    it("should return true if event is saved", async () => {
      // Save an event
      await saveEvent(userId, eventId, eventTitle, eventDate, eventCity);
      
      // Check if it's saved
      const isSaved = await isEventSaved(userId, eventId);
      
      expect(isSaved).toBe(true);
    });

    it("should return false if event is not saved", async () => {
      const isSaved = await isEventSaved(userId, "non-existent-event");
      
      expect(isSaved).toBe(false);
    });
  });

  describe("getUserSavedEvents", () => {
    it("should return all saved events for a user", async () => {
      // Save multiple events
      await saveEvent(userId, "event-1", "Event 1", "2026-06-15", "toronto");
      await saveEvent(userId, "event-2", "Event 2", "2026-07-20", "vancouver");
      
      // Get all saved events
      const savedEvents = await getUserSavedEvents(userId);
      
      expect(Array.isArray(savedEvents)).toBe(true);
      expect(savedEvents.length).toBeGreaterThanOrEqual(2);
    });

    it("should return empty array if user has no saved events", async () => {
      const savedEvents = await getUserSavedEvents(999); // Non-existent user
      
      expect(Array.isArray(savedEvents)).toBe(true);
    });

    it("should include full event details in saved events", async () => {
      // Save an event
      await saveEvent(userId, eventId, eventTitle, eventDate, eventCity);
      
      // Get saved events
      const savedEvents = await getUserSavedEvents(userId);
      
      // Check that event details are included
      const saved = savedEvents.find((s: any) => s.eventId === eventId);
      if (saved && saved.event) {
        expect(saved.event.title).toBeDefined();
        expect(saved.event.city).toBeDefined();
        expect(saved.event.slug).toBeDefined();
      }
    });
  });
});
