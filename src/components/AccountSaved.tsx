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
  Heart,
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
    enabled: !!user,
  });

  const utils = trpc.useUtils();
  const unsaveMutation = trpc.savedEvents.unsave.useMutation({
    onSuccess: () => utils.savedEvents.list.invalidate(),
  });

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

  const filteredEvents = useMemo(() => {
    const now = new Date();
    let filtered = savedEvents.filter(
      (item: SavedEventWithEvent): item is SavedEventWithNonNullEvent =>
        item.event !== null
    );

    // Show all events in upcoming tab (since seed data is all future dates)
    if (filterType === "upcoming") {
      return filtered.sort(
        (a: SavedEventWithNonNullEvent, b: SavedEventWithNonNullEvent) => {
          const dateA = parseEventDate(a.event.date, a.event.time);
          const dateB = parseEventDate(b.event.date, b.event.time);
          return dateA.getTime() - dateB.getTime();
        }
      );
    }

    // Filter past events
    filtered = filtered.filter((item: SavedEventWithNonNullEvent) => {
      const eventDate = parseEventDate(item.event.date, item.event.time);
      return eventDate < now;
    });

    return filtered.sort(
      (a: SavedEventWithNonNullEvent, b: SavedEventWithNonNullEvent) => {
        const dateA = parseEventDate(a.event.date, a.event.time);
        const dateB = parseEventDate(b.event.date, b.event.time);
        return dateB.getTime() - dateA.getTime();
      }
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

          {/* Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-lg">
            {(["upcoming", "past"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${
                  filterType === type
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
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
              <div key={i} className="h-28 bg-white rounded-lg animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bookmark className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              {filterType === "upcoming" ? "No saved upcoming events" : "No saved past events"}
            </h3>
            <p className="text-slate-500 text-sm mb-5">Start bookmarking events you're interested in!</p>
            <Button
              onClick={() => router.push("/")}
              className="bg-indigo-600 hover:bg-indigo-700 px-6 rounded-lg text-sm"
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
                  className="overflow-hidden border-slate-200 hover:shadow-sm transition-shadow"
                >
                  <div className="p-4">
                    <div className="flex gap-4">
                      {/* Event Image */}
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-200">
                        <img
                          src={event.image || "/placeholder-event.jpg"}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Event Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-slate-900 text-sm line-clamp-1">
                              {event.title}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {event.city} • {event.category}
                            </p>
                          </div>
                          {event.price && (
                            <div className="flex-shrink-0">
                              <span className="text-xs font-semibold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md whitespace-nowrap">
                                {event.price}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{formatDate(event.date)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{formatTime(event.time)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between gap-2">
                      <Button
                        onClick={() => router.push(`/${event.citySlug}/${event.slug}`)}
                        variant="ghost"
                        size="sm"
                        className="text-slate-600 hover:text-slate-900 rounded-md h-auto px-3 py-1.5 text-xs font-medium"
                      >
                        View Details
                      </Button>
                      <Button
                        onClick={() => unsaveMutation.mutate({ eventId: event.id })}
                        disabled={unsaveMutation.isPending}
                        variant="ghost"
                        size="sm"
                        className="text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md h-auto px-3 py-1.5 text-xs font-medium"
                      >
                        {unsaveMutation.isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <Heart className="w-3.5 h-3.5 mr-1 fill-current" />
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
