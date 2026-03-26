"use client";

import { useMemo, useState } from "react";
import SearchNavbar from "@/components/SearchNavbar";
import EventCard from "@/components/EventCard";
import { useCity } from "@/contexts/CityContext";
import { trpc } from "@/lib/trpc";
import { CATEGORIES } from "@/lib/events-data";

export default function SearchPage() {
  const { citySlug, cityName } = useCity();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [activeTab, setActiveTab] = useState<"discover" | "search">("discover");

  const { data: categoryEvents = [] } = trpc.events.getByCity.useQuery(
    {
      citySlug,
      category: category === "all" ? undefined : category,
      search: query || undefined,
      date: undefined,
    },
    { enabled: !!citySlug }
  );

  const { data: searchEvents = [] } = trpc.events.search.useQuery(
    { query, citySlug, category: category === "all" ? undefined : category },
    { enabled: activeTab === "search" && query.trim().length > 0 }
  );

  const { data: featuredEvents = [] } = trpc.events.getFeatured.useQuery(
    { citySlug },
    { enabled: !!citySlug }
  );

  const visibleEvents = activeTab === "search" ? searchEvents : categoryEvents;

  const popularEvents = useMemo(
    () =>
      [...featuredEvents]
        .sort((a, b) => (b.interested ?? 0) - (a.interested ?? 0))
        .slice(0, 6),
    [featuredEvents]
  );

  const weekendEvents = useMemo(
    () => categoryEvents.slice(0, 6),
    [categoryEvents]
  );

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

  const categoryPicks = useMemo(() => {
    const top = CATEGORIES.slice(0, 6);
    return top.map((cat) => ({
      ...cat,
      events: featuredEvents.filter((e: any) => e.category === cat.id).slice(0, 3),
    }));
  }, [featuredEvents]);

  const hasActiveSearch = query.trim().length > 0 || category !== "all";

  return (
    <div className="min-h-screen bg-gray-50">
      <SearchNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-10">
        {!hasActiveSearch ? (
          <>
            <section>
              <div className="flex items-end justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Browse by category</h2>
                  <p className="text-sm text-gray-500">
                    Explore what&apos;s happening in {cityName}.
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                {categoryPicks.map((group) => (
                  <div key={group.id}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-700">
                        {group.icon} {group.label}
                      </h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {group.events.map((event: any) => (
                        <EventCard key={event.id} event={event} citySlug={citySlug} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Popular in {cityName}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {popularEvents.map((event: any) => (
                  <EventCard key={event.id} event={event} citySlug={citySlug} />
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4">By same organizers</h2>
              <div className="space-y-6">
                {organizerGroups.map(([organizer, list]) => (
                  <div key={organizer}>
                    <p className="text-sm font-semibold text-gray-700 mb-3">{organizer}</p>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {list.slice(0, 3).map((event: any) => (
                        <EventCard key={event.id} event={event} citySlug={citySlug} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Happening this weekend</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {weekendEvents.map((event: any) => (
                  <EventCard key={event.id} event={event} citySlug={citySlug} />
                ))}
              </div>
            </section>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Search results</h2>
                <p className="text-sm text-gray-500">
                  {activeTab === "search" ? "Text search" : "Filtered events"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("discover")}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
                    activeTab === "discover"
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  Browse
                </button>
                <button
                  onClick={() => setActiveTab("search")}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
                    activeTab === "search"
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  Search
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleEvents.length > 0 ? (
                visibleEvents.map((event: any) => (
                  <EventCard key={event.id} event={event} citySlug={citySlug} />
                ))
              ) : (
                <div className="col-span-full py-16 text-center text-gray-500">
                  No events found.
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
