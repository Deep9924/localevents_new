"use client";

import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Loader2,
  ArrowLeft,
  Bookmark,
  MapPin,
  Calendar,
  Clock,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { formatDate, formatTime } from "@/lib/utils";
import type { AppRouter } from "@/server/routers";
import type { inferRouterOutputs } from "@trpc/server";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type SavedEventWithEvent = RouterOutputs["savedEvents"]["list"][number];
type SavedEventWithNonNullEvent = SavedEventWithEvent & {
  event: NonNullable<SavedEventWithEvent["event"]>;
};

type FilterType = "upcoming" | "past";

export default function AccountSaved() {
  const { user, loading: authLoading, isAuthenticated } = useAuth({
    redirectOnUnauthenticated: true,
  });
  const router = useRouter();
  const [filterType, setFilterType] = useState<FilterType>("upcoming");

  const {
    data: savedEvents = [],
    isLoading: eventsLoading,
  } = trpc.savedEvents.list.useQuery(undefined, {
    enabled: isAuthenticated && !!user,
  });

  const utils = trpc.useUtils();
  const unsaveMutation = trpc.savedEvents.unsave.useMutation({
    onSuccess: () => utils.savedEvents.list.invalidate(),
  });

  const filteredEvents = useMemo(() => {
    const now = new Date();
    let filtered = savedEvents.filter(
      (item: SavedEventWithEvent): item is SavedEventWithNonNullEvent =>
        item.event !== null
    );

    filtered = filtered.filter((item: SavedEventWithNonNullEvent) => {
      const eventDate = new Date(`${item.event.date}T${item.event.time || "00:00"}`);
      return filterType === "upcoming" ? eventDate >= now : eventDate < now;
    });

    return filtered.sort(
      (a: SavedEventWithNonNullEvent, b: SavedEventWithNonNullEvent) =>
        new Date(`${a.event.date}T${a.event.time || "00:00"}`).getTime() -
        new Date(`${b.event.date}T${b.event.time || "00:00"}`).getTime()
    );
  }, [savedEvents, filterType]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }
  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-5">
            <button
              onClick={() => router.push("/account/profile")}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h1 className="text-2xl font-bold text-slate-900">Saved Events</h1>
          </div>

          {/* Simplified Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl">
            {(["upcoming", "past"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  filterType === type
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {type === "upcoming" ? "Upcoming" : "Past Events"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {eventsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white rounded-xl animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bookmark className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {filterType === "upcoming" ? "No saved upcoming events" : "No saved past events"}
            </h3>
            <p className="text-slate-500 text-sm mb-5">Start bookmarking events you're interested in!</p>
            <Button
              onClick={() => router.push("/")}
              className="bg-indigo-600 hover:bg-indigo-700 px-6 rounded-full text-sm"
            >
              Explore Events
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map((savedEvent: SavedEventWithNonNullEvent) => {
              const event = savedEvent.event;

              return (
                <Card
                  key={event.id}
                  className="overflow-hidden border-slate-200 hover:shadow-md transition-shadow"
                >
                  <div className="p-3 sm:p-4">
                    <div className="flex gap-3">
                      {/* Event Image */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-100">
                        <img
                          src={event.image || "/placeholder-event.jpg"}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Event Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm leading-tight line-clamp-1">
                            {event.title}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {event.city} • {event.category}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-600 mt-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-indigo-500" />
                            <span>{formatDate(event.date)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-indigo-500" />
                            <span>{formatTime(event.time)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Price Badge */}
                      {event.price && (
                        <div className="flex items-start">
                          <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-md whitespace-nowrap">
                            {event.price}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions Row */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <Button
                        onClick={() => router.push(`/${event.citySlug}/${event.slug}`)}
                        variant="ghost"
                        size="sm"
                        className="text-slate-600 hover:text-indigo-600 rounded-lg h-auto px-3 py-1.5 text-xs font-medium"
                      >
                        View Details
                      </Button>
                      <Button
                        onClick={() => unsaveMutation.mutate({ eventId: event.id })}
                        disabled={unsaveMutation.isPending}
                        variant="outline"
                        size="sm"
                        className="border-slate-200 text-red-600 hover:bg-red-50 rounded-lg h-auto px-3 py-1.5 text-xs font-medium"
                      >
                        {unsaveMutation.isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Remove
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
