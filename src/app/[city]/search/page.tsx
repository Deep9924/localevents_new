"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import SearchNavbar from "@/components/SearchNavbar";
import EventCard from "@/components/EventCard";
import { useCity } from "@/contexts/CityContext";
import { trpc } from "@/lib/trpc";


function HorizontalRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6">
      {children}
    </div>
  );
}

type RouterDate = "all" | "today" | "tomorrow" | "weekend" | "week" | undefined;

export default function SearchPage() {
  const { citySlug, cityName } = useCity();
  const searchParams = useSearchParams();

  // These only change when the URL changes (i.e. user pressed search or picked a filter)
  const query    = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "all";
  const date     = (searchParams.get("date") ?? "any") as
    | "any" | "today" | "tomorrow" | "weekend" | "week";
  const price    = searchParams.get("price") ?? "any";
  const sort     = searchParams.get("sort") ?? "relevance";

  const hasActiveSearch = query.trim().length > 0 || category !== "all" || date !== "any" || price !== "any" || sort !== "relevance";

  // Map "any" → undefined so it matches the router's date enum
  const routerDate: RouterDate =
    date === "any" ? undefined : date as Exclude<RouterDate, undefined>;

  const { data: allEvents = [] } = trpc.events.getByCity.useQuery(
    { citySlug, category: category !== "all" ? category : undefined, date: routerDate, search: query, price, sort },
    { enabled: !!citySlug }
  );

  const { data: featuredEvents = [] } = trpc.events.getFeatured.useQuery(
    { citySlug },
    { enabled: !!citySlug && !hasActiveSearch }
  );

  const { data: categoriesFromDb = [] } = trpc.events.getCategories.useQuery();

  const visibleEvents = hasActiveSearch ? allEvents : [];

  const popularEvents = useMemo(
    () =>
      [...featuredEvents]
        .sort((a, b) => (b.interested ?? 0) - (a.interested ?? 0))
        .slice(0, 10),
    [featuredEvents]
  );

  const categoryPicks = useMemo(
    () =>
      categoriesFromDb
        .filter(cat => cat.id !== "all")
        .map((cat) => ({
          ...cat,
          events: featuredEvents.filter((e) => e.category === cat.id),
        })),
    [categoriesFromDb, featuredEvents]
  );
