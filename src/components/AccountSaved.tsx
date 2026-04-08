"use client";

import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  MapPin,
  Calendar,
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
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const d = new Date(`${dateStr}T${timeStr || "00:00"}:00`);
    if (!isNaN(d.getTime())) return d;
  }
  if (dateStr.includes(",")) {
    const currentYear = new Date().getFullYear();
    const withYear = dateStr.match(/\d{4}/)
      ? `${dateStr} ${timeStr || "00:00"}`
      : `${dateStr} ${currentYear} ${timeStr || "00:00"}`;
    const d = new Date(withYear);
    if (!isNaN(d.getTime())) return d;
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;
  return new Date();
};

export default function AccountSaved() {
  const { user, loading: authLoading, isAuthenticated } = useAuth({
    redirectOnUnauthenticated: true,
  });
  const router = useRouter();
  const [filterType, setFilterType] = useState<FilterType>("upcoming");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: savedEvents = [], isLoading: eventsLoading } =
    trpc.savedEvents.list.useQuery(undefined, { enabled: !!user });

  const utils = trpc.useUtils();
  const unsaveMutation = trpc.savedEvents.unsave.useMutation({
    onSuccess: () => {
      utils.savedEvents.list.invalidate();
      setDeletingId(null);
    },
    onError: () => setDeletingId(null),
  });

  const handleUnsave = (eventId: string) => {
    setDeletingId(eventId);
    unsaveMutation.mutate({ eventId });
  };

  const filteredEvents = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const withEvents = savedEvents.filter(
      (item: SavedEventWithEvent): item is SavedEventWithNonNullEvent =>
        item.event !== null
    );
    const filtered = withEvents.filter((item) => {
      const d = parseEventDate(item.event.date, item.event.time);
      return filterType === "upcoming" ? d >= now : d < now;
    });
    return filtered.sort((a, b) => {
      const da = parseEventDate(a.event.date, a.event.time).getTime();
      const db = parseEventDate(b.event.date, b.event.time).getTime();
      return filterType === "upcoming" ? da - db : db - da;
    });
  }, [savedEvents, filterType]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }
  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ── */}
      <div className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <div className="flex items-center gap-3 py-3">
            <button
              onClick={() => router.push("/account/profile")}
              className="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-[17px] font-semibold leading-tight text-slate-800">
                Saved Events
              </h1>
              <p className="text-[12px] text-slate-400">
                Events you've bookmarked
              </p>
            </div>
          </div>

          <div className="pb-3">
            <div className="flex rounded-2xl bg-slate-100 p-1">
              {(["upcoming", "past"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`flex-1 rounded-xl px-6 py-2 text-sm font-medium transition-all ${
                    filterType === type
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {type === "upcoming" ? "Upcoming" : "Past Events"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mx-auto max-w-2xl px-4 py-5 pb-16 sm:px-6">

        {eventsLoading ? (
          /* ── Skeleton ── */
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 py-3">
                <div className="h-[88px] w-[88px] animate-pulse rounded-2xl bg-slate-200 flex-shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3.5 w-3/4 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-1/4 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-2/5 animate-pulse rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>

        ) : filteredEvents.length === 0 ? (
          /* ── Empty state ── */
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <Bookmark className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">
              {filterType === "upcoming"
                ? "No saved upcoming events"
                : "No saved past events"}
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-400">
              {filterType === "upcoming"
                ? "Bookmark events you're interested in and they'll appear here."
                : "Past events you bookmarked will show up here."}
            </p>
            {filterType === "upcoming" && (
              <Button
                onClick={() => router.push("/")}
                className="mt-6 rounded-xl bg-slate-800 px-6 text-white hover:bg-slate-700"
              >
                Explore Events
              </Button>
            )}
          </div>

        ) : (
          /* ── Event rows ── */
          <div className="divide-y divide-slate-100">
            {filteredEvents.map((savedEvent: SavedEventWithNonNullEvent) => {
              const event = savedEvent.event;
              const isDeleting = deletingId === event.id;

              return (
                <div
                  key={event.id}
                  className="group flex items-stretch gap-4 py-3 first:pt-0 last:pb-0"
                >
                  {/* ── Square thumbnail ── */}
                  <button
                    onClick={() => router.push(`/${event.citySlug}/${event.slug}`)}
                    className="relative h-[88px] w-[88px] flex-shrink-0 self-start overflow-hidden rounded-2xl sm:h-24 sm:w-24"
                  >
                    {event.image ? (
                      <img
                        src={event.image}
                        alt={event.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-slate-600 via-slate-700 to-emerald-900" />
                    )}
                  </button>

                  {/* ── Right column: text + actions ── */}
                  <div className="flex min-w-0 flex-1 flex-col gap-1">

                    {/* Title + meta */}
                    <h3 className="line-clamp-2 text-[13px] font-bold leading-snug text-slate-800">
                      {event.title}
                    </h3>

                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      {event.category}
                    </span>

                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Calendar className="h-3 w-3 shrink-0" />
                      {formatDate(event.date)} · {formatTime(event.time)}
                    </span>

                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{event.venue ?? event.city}</span>
                    </span>

                    {/* Price pill */}
                    {event.price && (
                      <span className="mt-0.5 w-fit rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-white">
                        {event.price}
                      </span>
                    )}

                    {/* Actions — grouped together, left-aligned */}
                    <div className="mt-1.5 flex items-center gap-3">
                      <button
                        onClick={() => router.push(`/${event.citySlug}/${event.slug}`)}
                        className="flex items-center gap-0.5 text-[11px] font-medium text-slate-500 transition-colors hover:text-slate-800"
                      >
                        View details
                        <ArrowRight className="h-3 w-3" />
                      </button>

                      <span className="text-slate-200">|</span>

                      <button
                        onClick={() => handleUnsave(event.id)}
                        disabled={isDeleting}
                        className="flex items-center gap-1 text-[11px] font-medium text-slate-400 transition-colors hover:text-red-500 disabled:opacity-40"
                        aria-label="Remove saved event"
                      >
                        {isDeleting ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            Remove
                            <Trash2 className="h-3 w-3" />
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
