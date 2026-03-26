"use client";

import { useMemo, useState } from "react";
import SearchNavbar from "@/components/SearchNavbar";
import EventCard from "@/components/EventCard";
import { useCity } from "@/contexts/CityContext";
import { trpc } from "@/lib/trpc";

type Event = any;

export default function SearchPage() {
  const { citySlug, cityName } = useCity();
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { data: events = [] } = trpc.events.search.useQuery(
    { citySlug },
    { enabled: false }
  );

  const popularEvents = useMemo(
    () =>
      [...(events as Event[])]
        .sort((a, b) => (b.interested ?? 0) - (a.interested ?? 0))
        .slice(0, 6),
    [events]
  );

  const weekendEvents = useMemo(
    () =>
      (events as Event[])
        .filter((e) => /sat|sun/i.test(`${e.date ?? ""}`))
        .slice(0, 6),
    [events]
  );

  const organizerMap = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const e of events as Event[]) {
      const key = e.organizerName ?? e.organizer ?? "Unknown organizer";
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    return [...map.entries()].filter(([, arr]) => arr.length > 1).slice(0, 3);
  }, [events]);

  const showDiscovery = !hasSearched;

  return (
    <div className="min-h-screen bg-gray-50">
      <SearchNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-10">
        {showDiscovery ? (
          <>
            <section>
              <div className="flex items-end justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Browse by category
                  </h2>
                  <p className="text-sm text-gray-500">
                    Explore what's happening in {cityName}.
                  </p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(events as Event[])
                  .slice(0, 6)
                  .map((event) => (
                    <EventCard key={event.id} event={event} citySlug={citySlug} />
                  ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Popular in {cityName}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {popularEvents.map((event) => (
                  <EventCard key={event.id} event={event} citySlug={citySlug} />
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                By same organizers
              </h2>
              <div className="space-y-6">
                {organizerMap.map(([organizer, list]) => (
                  <div key={organizer}>
                    <p className="text-sm font-semibold text-gray-700 mb-3">
                      {organizer}
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {list.slice(0, 3).map((event) => (
                        <EventCard key={event.id} event={event} citySlug={citySlug} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Happening this weekend
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {weekendEvents.map((event) => (
                  <EventCard key={event.id} event={event} citySlug={citySlug} />
                ))}
              </div>
            </section>
          </>
        ) : (
          <>
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-64 rounded-2xl bg-white border border-gray-100 animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(events as Event[]).map((event) => (
                  <EventCard key={event.id} event={event} citySlug={citySlug} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
