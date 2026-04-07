"use client";

import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Loader2,
  ArrowLeft,
  Bookmark,
  Calendar,
  Clock,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useMemo, useRef } from "react";
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
  if (isNaN(eventDate.getTime())) return new Date();
  return eventDate;
};

function TicketStrip({ tickets }: { tickets: Array<{ barcode: string; label?: string }> }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(0);
  const total = tickets.length;
  const current = tickets[index];

  const scrollTo = (next: number) => {
    const clamped = Math.max(0, Math.min(total - 1, next));
    setIndex(clamped);
    const el = ref.current;
    if (el) el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
      <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
        <span>Ticket {index + 1} of {total}</span>
        <span>{current?.label || "Barcode"}</span>
      </div>
      <div className="relative">
        <button
          type="button"
          onClick={() => scrollTo(index - 1)}
          disabled={index === 0}
          className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-slate-200 bg-white p-1.5 shadow-sm disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => scrollTo(index + 1)}
          disabled={index === total - 1}
          className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-slate-200 bg-white p-1.5 shadow-sm disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <div ref={ref} className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar">
          {tickets.map((t, i) => (
            <div key={t.barcode + i} className="min-w-full snap-center px-8">
              <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
                <div className="text-center text-[11px] uppercase tracking-[0.2em] text-slate-400 mb-3">{t.label || `Ticket ${i + 1}`}</div>
                <div className="h-20 rounded-xl bg-[repeating-linear-gradient(90deg,#111827_0,#111827_2px,#fff_2px,#fff_6px)] opacity-90" />
                <div className="mt-3 font-mono text-[11px] text-slate-500 text-center break-all">{t.barcode}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AccountSaved() {
  const { user, loading: authLoading, isAuthenticated } = useAuth({
    redirectOnUnauthenticated: true,
  });
  const router = useRouter();
  const [filterType, setFilterType] = useState<FilterType>("upcoming");

  const { data: savedEvents = [], isLoading: eventsLoading } = trpc.savedEvents.list.useQuery(undefined, {
    enabled: !!user,
  });

  const utils = trpc.useUtils();
  const unsaveMutation = trpc.savedEvents.unsave.useMutation({
    onSuccess: () => utils.savedEvents.list.invalidate(),
  });

  const filteredEvents = useMemo(() => {
    const now = new Date();
    const filtered = savedEvents
      .filter((item: SavedEventWithEvent): item is SavedEventWithNonNullEvent => item.event !== null)
      .filter((item: SavedEventWithNonNullEvent) => {
        const eventDate = parseEventDate(item.event.date, item.event.time);
        return filterType === "upcoming" ? eventDate >= now : eventDate < now;
      })
      .sort((a, b) =>
        filterType === "upcoming"
          ? parseEventDate(a.event.date, a.event.time).getTime() - parseEventDate(b.event.date, b.event.time).getTime()
          : parseEventDate(b.event.date, b.event.time).getTime() - parseEventDate(a.event.date, a.event.time).getTime()
      );
    return filtered;
  }, [savedEvents, filterType]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="mb-4 flex items-center gap-3">
            <button
              onClick={() => router.push("/account/profile")}
              className="rounded-full p-2 transition-colors hover:bg-slate-100"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Saved Events</h1>
              <p className="text-sm text-slate-500">Manage your bookmarked events</p>
            </div>
          </div>

          <div className="flex rounded-2xl bg-slate-100 p-1">
            {(["upcoming", "past"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                  filterType === type
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {type === "upcoming" ? "Upcoming" : "Past Events"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6">
        {eventsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white" />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <Bookmark className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              {filterType === "upcoming" ? "No saved upcoming events" : "No saved past events"}
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
              Start bookmarking events you&apos;re interested in.
            </p>
            {filterType === "upcoming" && (
              <Button onClick={() => router.push("/")} className="mt-6 rounded-xl bg-indigo-600 px-6 hover:bg-indigo-700">
                Explore Events
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((savedEvent) => {
              const event = savedEvent.event;
              const isPast = filterType === "past";
              const tickets = Array.from({ length: Math.max(1, savedEvent.quantity || 1) }).map((_, i) => ({
                barcode: `${event.id}-${i + 1}-${event.slug}`,
                label: `Seat ${i + 1}`,
              }));

              return (
                <Card key={event.id} className={`overflow-hidden border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md ${isPast ? "opacity-80" : ""}`}>
                  <div className="p-4 sm:p-5">
                    <div className="flex gap-4">
                      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                        <img
                          src={event.image || "/placeholder-event.jpg"}
                          alt={event.title}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold text-slate-900">{event.title}</h3>
                            <p className="mt-0.5 text-xs text-slate-500">{event.city} • {event.category}</p>
                          </div>
                          {event.price && (
                            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{event.price}</span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-slate-400" />{formatDate(event.date)}</span>
                          <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-slate-400" />{formatTime(event.time)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 space-y-4 border-t border-slate-200 pt-4">
                      <TicketStrip tickets={tickets} />

                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => router.push(`/${event.citySlug}/${event.slug}`)}
                          variant="ghost"
                          size="sm"
                          className="rounded-xl px-4 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                        >
                          View details
                        </Button>
                        <Button
                          onClick={() => unsaveMutation.mutate({ eventId: event.id })}
                          disabled={unsaveMutation.isPending}
                          variant="ghost"
                          size="sm"
                          className="ml-auto rounded-xl px-4 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          {unsaveMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="mr-1.5 h-4 w-4" />
                              Remove
                            </>
                          )}
                        </Button>
                      </div>
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
