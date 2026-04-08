"use client";

import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ArrowLeft,
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
  // ← track exactly which card is being deleted
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

          {/* Row 1: back + title */}
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

          {/* Row 2: pill tabs */}
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
      <div className="mx-auto max-w-2xl px-4 py-6 pb-16 sm:px-6">

        {eventsLoading ? (
          /* ── Skeleton ── */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-[3/4] animate-pulse rounded-3xl bg-slate-200"
              />
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
          /* ── Cards ── */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {filteredEvents.map((savedEvent: SavedEventWithNonNullEvent) => {
              const event = savedEvent.event;
              const isDeleting = deletingId === event.id; // ← per-card check

              return (
                <div
                  key={event.id}
                  className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md"
                  style={{ aspectRatio: "3 / 4" }}
                >
                  {/* ── Full-bleed image + gradient (top ~75% of card) ── */}
                  <div className="relative min-h-0 flex-1 overflow-hidden">
                    <button
                      onClick={() => router.push(`/${event.citySlug}/${event.slug}`)}
                      className="absolute inset-0 h-full w-full"
                    >
                      <img
                        src={event.image || "/placeholder-event.jpg"}
                        alt={event.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </button>

                    {/* Gradient — fades image into white at the bottom */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />

                    {/* Price badge */}
                    {event.price && (
                      <div className="absolute top-3 right-3 rounded-full bg-black/50 px-2.5 py-1 backdrop-blur-sm">
                        <span className="text-[11px] font-semibold text-white">
                          {event.price}
                        </span>
                      </div>
                    )}

                    {/* Category + title sit at the bottom of the image area */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <span className="mb-1.5 inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white backdrop-blur-sm">
                        {event.category}
                      </span>
                      <button
                        onClick={() => router.push(`/${event.citySlug}/${event.slug}`)}
                        className="block text-left"
                      >
                        <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-white drop-shadow-sm sm:text-[16px]">
                          {event.title}
                        </h3>
                      </button>
                    </div>
                  </div>

                  {/* ── White info strip (bottom ~25%) ── */}
                  <div className="flex-shrink-0 bg-white px-4 pb-4 pt-2">
                    <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <Calendar className="h-3 w-3 shrink-0 text-slate-400" />
                          {formatDate(event.date)} · {formatTime(event.time)}
                        </span>
                        <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                          <span className="truncate">{event.venue ?? event.city}</span>
                        </span>
                      </div>

                      {/* Remove button — only this card shows spinner */}
                      <button
                        onClick={() => handleUnsave(event.id)}
                        disabled={isDeleting}
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                        aria-label="Remove saved event"
                      >
                        {isDeleting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
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
