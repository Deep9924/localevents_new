"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import SearchNavbar from "@/components/SearchNavbar";
import EventCard from "@/components/EventCard";
import { useCity } from "@/contexts/CityContext";
import { trpc } from "@/lib/trpc";
import { CATEGORIES } from "@/lib/events-data";

function HorizontalRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6">
      {children}
    </div>
  );
}

export default function SearchPage() {
  const { citySlug, cityName } = useCity();
  const searchParams = useSearchParams();

  // These only change when the URL changes (i.e. user pressed search or picked a filter)
  const query    = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "all";
  const date     = (searchParams.get("date") ?? undefined) as
    | "today" | "tomorrow" | "weekend" | "week" | undefined;

  const hasActiveSearch = query.trim().length > 0 || category !== "all" || !!date;

  // Always fetch for discovery view
  const { data: featuredEvents = [] } = trpc.events.getFeatured.useQuery(
    { citySlug },
    { enabled: !!citySlug }
  );

  // Only fetch when a category or date filter is active (no text query)
  const { data: categoryEvents = [] } = trpc.events.getByCity.useQuery(
    { citySlug, category: category !== "all" ? category : undefined, date },
    { enabled: !!citySlug && (category !== "all" || !!date) && !query }
  );

  // Only fetch when user actually submitted a search query
  const { data: searchResults = [] } = trpc.events.search.useQuery(
    { query, citySlug, category: category !== "all" ? category : undefined },
    { enabled: query.trim().length > 0 }
  );

  const visibleEvents =
    query.trim().length > 0
      ? searchResults
      : category !== "all" || !!date
        ? categoryEvents
        : [];

  const popularEvents = useMemo(
    () =>
      [...featuredEvents]
        .sort((a, b) => (b.interested ?? 0) - (a.interested ?? 0))
        .slice(0, 10),
    [featuredEvents]
  );

  const categoryPicks = useMemo(
    () =>
      CATEGORIES.slice(1)
        .map((cat) => ({
          ...cat,
          events: featuredEvents.filter((e: any) => e.category === cat.id),
        }))
        .filter((g) => g.events.length > 0),
    [featuredEvents]
  );

  const organizerGroups = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const event of featuredEvents as any[]) {
      const key = event.organizerName ?? event.organizer ?? "Unknown";
      map.set(key, [...(map.get(key) ?? []), event]);
    }
    return [...map.entries()].filter(([, arr]) => arr.length > 1).slice(0, 3);
  }, [featuredEvents]);

  return (
    <div className="min-h-screen bg-gray-50">
      <SearchNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-10">

        {hasActiveSearch ? (
          /* Results view */
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {query
                  ? `Results for "${query}"`
                  : `${CATEGORIES.find((c) => c.id === category)?.label ?? "Filtered"} events`}
              </h2>
              <p className="text-sm text-gray-500">
                {visibleEvents.length} event{visibleEvents.length !== 1 ? "s" : ""} in {cityName}
              </p>
            </div>

            {visibleEvents.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visibleEvents.map((event: any) => (
                  <EventCard key={event.id} event={event} citySlug={citySlug} />
                ))}
              </div>
            ) : (
              <div className="py-24 text-center">
                <p className="text-5xl mb-4">🔍</p>
                <p className="font-semibold text-gray-700 text-lg">No events found</p>
                <p className="text-sm text-gray-400 mt-1">
                  Try different keywords or adjust filters
                </p>
              </div>
            )}
          </section>

        ) : (
          /* Discovery view */
          <>
            {popularEvents.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-3">
                  Popular in {cityName}
                </h2>
                <HorizontalRow>
                  {popularEvents.map((event: any) => (
                    <div key={event.id} className="shrink-0 w-64 sm:w-72">
                      <EventCard event={event} citySlug={citySlug} />
                    </div>
                  ))}
                </HorizontalRow>
              </section>
            )}

            {categoryPicks.map((group) => (
              <section key={group.id}>
                <h2 className="text-lg font-bold text-gray-900 mb-3">
                  {group.icon} {group.label}
                </h2>
                <HorizontalRow>
                  {group.events.map((event: any) => (
                    <div key={event.id} className="shrink-0 w-64 sm:w-72">
                      <EventCard event={event} citySlug={citySlug} />
                    </div>
                  ))}
                </HorizontalRow>
              </section>
            ))}

            {organizerGroups.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  More from the same organizers
                </h2>
                <div className="space-y-6">
                  {organizerGroups.map(([organizer, list]) => (
                    <div key={organizer}>
                      <p className="text-sm font-semibold text-gray-600 mb-2">
                        {organizer}
                      </p>
                      <HorizontalRow>
                        {list.slice(0, 5).map((event: any) => (
                          <div key={event.id} className="shrink-0 w-64 sm:w-72">
                            <EventCard event={event} citySlug={citySlug} />
                          </div>
                        ))}
                      </HorizontalRow>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
