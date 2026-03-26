// src/hooks/useSearchFilters.ts
//
// Drop this hook into your search page to apply price/sort/date/category
// filtering on whatever event array you pass in.
//
// Usage:
//   const searchParams = useSearchParams();
//   const { filtered, total } = useSearchFilters(allEvents, searchParams);

import { useMemo } from "react";
import type { ReadonlyURLSearchParams } from "next/navigation";
import type { Event } from "@/lib/events-data";

type SortOption = "relevance" | "date-asc" | "date-desc" | "price-asc" | "price-desc";

function parsePrice(priceStr: string | null | undefined): number {
  if (!priceStr || priceStr === "Free" || priceStr === "free") return 0;
  // Strip currency symbols and take the first number found
  const match = priceStr.replace(/[^0-9.]/g, "").match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

function eventMatchesDate(event: Event, dateFilter: string): boolean {
  if (dateFilter === "any") return true;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Try to parse event.date — expects formats like "Sat Mar 29" or "2024-03-29"
  const parsed = new Date(event.date);
  if (isNaN(parsed.getTime())) return true; // can't parse → don't exclude

  const eventDay = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());

  switch (dateFilter) {
    case "today":
      return eventDay.getTime() === today.getTime();
    case "tomorrow": {
      const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
      return eventDay.getTime() === tomorrow.getTime();
    }
    case "weekend": {
      const day = eventDay.getDay(); // 0=Sun, 6=Sat
      return day === 0 || day === 6;
    }
    case "week": {
      const weekEnd = new Date(today); weekEnd.setDate(today.getDate() + 7);
      return eventDay >= today && eventDay <= weekEnd;
    }
    default:
      return true;
  }
}

function eventMatchesPrice(event: Event, priceFilter: string): boolean {
  if (priceFilter === "any") return true;
  const amount = parsePrice(event.price);
  switch (priceFilter) {
    case "free":     return amount === 0;
    case "under20":  return amount > 0 && amount < 20;
    case "20to50":   return amount >= 20 && amount <= 50;
    case "50plus":   return amount > 50;
    default:         return true;
  }
}

function sortEvents(events: Event[], sortOption: SortOption): Event[] {
  const copy = [...events];
  switch (sortOption) {
    case "date-asc":
      return copy.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    case "date-desc":
      return copy.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    case "price-asc":
      return copy.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    case "price-desc":
      return copy.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    case "relevance":
    default:
      return copy; // keep original order (e.g. API-ranked)
  }
}

export function useSearchFilters(
  events: Event[],
  searchParams: ReadonlyURLSearchParams,
): { filtered: Event[]; total: number } {
  const query    = searchParams.get("search")   ?? "";
  const category = searchParams.get("category") ?? "all";
  const date     = searchParams.get("date")     ?? "any";
  const price    = searchParams.get("price")    ?? "any";
  const sort     = (searchParams.get("sort")    ?? "relevance") as SortOption;

  const filtered = useMemo(() => {
    let result = events;

    // Text search across title, description, venue
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(e =>
        e.title.toLowerCase().includes(q) ||
        (e.description ?? "").toLowerCase().includes(q) ||
        (e.venue ?? "").toLowerCase().includes(q)
      );
    }

    // Category
    if (category !== "all") {
      result = result.filter(e => e.category === category);
    }

    // Date
    result = result.filter(e => eventMatchesDate(e, date));

    // Price
    result = result.filter(e => eventMatchesPrice(e, price));

    // Sort
    result = sortEvents(result, sort);

    return result;
  }, [events, query, category, date, price, sort]);

  return { filtered, total: filtered.length };
}
