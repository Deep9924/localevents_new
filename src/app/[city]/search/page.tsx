"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import SearchNavbar from "@/components/SearchNavbar";
import EventCard from "@/components/EventCard";
import { useCity } from "@/contexts/CityContext";
import { trpc } from "@/lib/trpc";
import { CATEGORIES } from "@/lib/events-data";

export default function SearchPage() {
  const { citySlug, cityName } = useCity();
  const searchParams = useSearchParams();

  // read filters from URL — SearchNavbar is the source of truth
  const query = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "all";
  const date = (searchParams.get("date") ?? undefined) as
    | "all" | "today" | "tomorrow" | "weekend" | "week"
    | undefined;

  const { data: categoryEvents = [] } = trpc.events.getByCity.useQuery(
    {
      citySlug,
      category: category !== "all" ? category : undefined,
      search: query || undefined,
      date: date ?? undefined,
    },
    { enabled: !!citySlug }
  );

  const { data: searchResults = [] } = trpc.events.search.useQuery(
    { query, citySlug, category: category !== "all" ? category : undefined },
    { enabled: query.trim().length > 0 }
  );

  const { data: featuredEvents = [] } = trpc.events.getFeatured.useQuery(
    { citySlug },
    { enabled: !!citySlug }
  );

  const visibleEvents = query.trim().length > 0 ? searchResults : categoryEvents;
  const hasActiveSearch = query.trim().length > 0 || category !== "all" || !!date;

  const popularEvents = useMemo(
    () =>
      [...featuredEvents]
        .sort((a, b) => (b.interested ?? 0) - (a.interested ?? 0))
        .slice(0, 8),
    [featuredEvents]
  );

  // only categories that actually have events
  const categoryPicks = useMemo(() => {
    return CATEGORIES.map((cat) => ({
      ...cat,
      events: featuredEvents.filter((e: any) => e.category === cat.id),
    })).filter((group) => group.events.length > 0);
  }, [featuredEvents]);

  const organizerGroups = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const event of featuredEvents as any[]) {
      const key = event.organizerName ?? event.organizer ?? "Unknown organizer";
      const arr = map.get(key) ?? [];
      arr.push(event);
      map.set(key, arr);
    }
    return [...map.entries()].filter(([, arr]) => arr.length > 1).slice(0, 3);
  }, [featuredEvents]);

  return (
    <div className="min-h-screen bg-gray-50">
      <SearchNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-10">

        {hasActiveSearch ? (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {query ? `Results for "${query}"` : "Filtered events"}
                </h2>
                <p className="text-sm text-gray-500">
                  {visibleEvents.length} event{visibleEvents.length !== 1 ? "s" : ""} found in {cityName}
                </p>
              </div>
            </div>

            {visibleEvents.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visibleEvents.map((event: any) => (
                  <EventCard key={event.id} event={event} citySlug={citySlug} />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <p className="text-4xl mb-3">🔍</p>
                <p className="text-gray-700 font-semibold text-lg">No events found</p>
                <p className="text-gray-400 text-sm mt-1">Try different keywords or filters</p>
              </div>
            )}
          </section>

        ) : (
          <>
            {popularEvents.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-3">Popular in {cityName}</h2>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
                  {popularEvents.map((event: any) => (
                    <div key={event.id} className="shrink-0 w-72">
                      <EventCard event={event} citySlug={citySlug} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {categoryPicks.map((group) => (
              <section key={group.id}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-gray-900">
                    {group.icon} {group.label}
                  </h2>
                </div>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
                  {group.events.map((event: any) => (
                    <div key={event.id} className="shrink-0 w-72">
                      <EventCard event={event} citySlug={citySlug} />
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {organizerGroups.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-3">More from the same organizers</h2>
                <div className="space-y-6">
                  {organizerGroups.map(([organizer, list]) => (
                    <div key={organizer}>
                      <p className="text-sm font-semibold text-gray-600 mb-2">{organizer}</p>
                      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
                        {list.slice(0, 4).map((event: any) => (
                          <div key={event.id} className="shrink-0 w-72">
                            <EventCard event={event} citySlug={citySlug} />
                          </div>
                        ))}
                      </div>
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
