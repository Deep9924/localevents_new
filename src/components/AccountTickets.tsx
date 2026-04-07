"use client";

import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ArrowLeft,
  Bookmark,
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

const parseEventDate = (dateStr: string, timeStr?: string): Date => {
  let eventDate: Date;
  if (dateStr.includes(",")) {
    const currentYear = new Date().getFullYear();
    eventDate = new Date(`${dateStr}, ${currentYear} ${timeStr || "00:00"}`);
  } else {
    eventDate = new Date(`${dateStr}T${timeStr || "00:00"}`);
  }
  if (isNaN(eventDate.getTime())) {
    console.warn("Invalid date:", dateStr);
    return new Date();
  }
  return eventDate;
};

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
    enabled: !!user,
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
      const eventDate = parseEventDate(item.event.date, item.event.time);
      return filterType === "upcoming" ? eventDate >= now : eventDate < now;
    });

    return filtered.sort(
      (a: SavedEventWithNonNullEvent, b: SavedEventWithNonNullEvent) =>
        filterType === "upcoming"
          ? parseEventDate(a.event.date, a.event.time).getTime() -
            parseEventDate(b.event.date, b.event.time).getTime()
          : parseEventDate(b.event.date, b.event.time).getTime() -
            parseEventDate(a.event.date, a.event.time).getTime()
    );
  }, [savedEvents, filterType]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.push("/account/profile")}
              className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
            </button>
            <h1 className="text-lg font-semibold text-slate-900">Saved Events</h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-slate-100">
            {(["upcoming", "past"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`pb-3 text-sm transition-all border-b-2 -mb-px ${
                  filterType === type
                    ? "border-indigo-600 text-indigo-600 font-medium"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                {type === "upcoming" ? "Upcoming" : "Past Events"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-5">
        {eventsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-white rounded-xl animate-pulse border border-slate-100"
              />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bookmark className="w-5 h-5 text-slate-300" />
            </div>
            <p className="text-sm text-slate-500 mb-4">
              {filterType === "upcoming"
                ? "No saved upcoming events"
                : "No saved past events"}
            </p>
            {filterType === "upcoming" && (
              <button
                onClick={() => router.push("/")}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Browse events →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map((savedEvent: SavedEventWithNonNullEvent) => {
              const event = savedEvent.event;
              const isPast = filterType === "past";

              return (
                <div
                  key={event.id}
                  className={`bg-white rounded-xl border border-slate-100 hover:border-slate-200 transition-all duration-200 overflow-hidden ${
                    isPast ? "opacity-70" : ""
                  }`}
                >
                  {/* Main row */}
                  <div className="flex gap-3 p-4">
                    {/* Image */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                      <img
                        src={event.image || "/placeholder-event.jpg"}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-sm font-medium text-slate-900 truncate">
                            {event.title}
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {event.city} · {event.category}
                          </p>
                        </div>
                        {event.price && (
                          <span className="text-xs font-medium text-slate-600 flex-shrink-0">
                            {event.price}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(event.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(event.time)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action strip */}
                  <div className="flex items-center gap-1 px-4 pb-3">
                    <button
                      onClick={() => router.push(`/${event.citySlug}/${event.slug}`)}
                      className="text-xs text-slate-500 hover:text-slate-700 px-2.5 py-1.5 rounded-md hover:bg-slate-50 transition-colors"
                    >
                      View event
                    </button>

                    <div className="ml-auto">
                      <button
                        onClick={() => unsaveMutation.mutate({ eventId: event.id })}
                        disabled={unsaveMutation.isPending}
                        className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 px-2.5 py-1.5 rounded-md hover:bg-red-50 transition-colors border border-slate-100"
                      >
                        {unsaveMutation.isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="w-3 h-3" />
                            Remove
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
