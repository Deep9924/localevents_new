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

  const { data: savedEvents = [], isLoading: eventsLoading } =
    trpc.savedEvents.list.useQuery(undefined, { enabled: !!user });

  const utils = trpc.useUtils();
  const unsaveMutation = trpc.savedEvents.unsave.useMutation({
    onSuccess: () => utils.savedEvents.list.invalidate(),
  });

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
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }
  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen bg-slate-900">

      {/* ── Ambient background blobs ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-blue-500/15 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-indigo-500/10 blur-[100px]" />
      </div>

      {/* ── Header ── */}
      <div className="relative z-10 border-b border-white/10 backdrop-blur-xl bg-white/5">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">

          {/* Row 1: back + title */}
          <div className="flex items-center gap-3 py-3">
            <button
              onClick={() => router.push("/account/profile")}
              className="rounded-full p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-[17px] font-semibold leading-tight text-white">
                Saved Events
              </h1>
              <p className="text-[12px] text-white/40">
                Events you've bookmarked
              </p>
            </div>
          </div>

          {/* Row 2: pill tabs */}
          <div className="pb-3">
            <div className="flex rounded-2xl bg-white/10 p-1 backdrop-blur-sm">
              {(["upcoming", "past"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`flex-1 rounded-xl px-6 py-2 text-sm font-medium transition-all ${
                    filterType === type
                      ? "bg-white/20 text-white shadow-sm backdrop-blur-sm"
                      : "text-white/50 hover:text-white"
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
      <div className="relative z-10 mx-auto max-w-2xl px-4 py-6 pb-16 sm:px-6">

        {eventsLoading ? (
          /* ── Skeleton ── */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-[3/4] animate-pulse rounded-3xl bg-white/5"
              />
            ))}
          </div>

        ) : filteredEvents.length === 0 ? (
          /* ── Empty state ── */
          <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-16 text-center backdrop-blur-xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
              <Bookmark className="h-6 w-6 text-white/40" />
            </div>
            <h3 className="text-lg font-semibold text-white">
              {filterType === "upcoming"
                ? "No saved upcoming events"
                : "No saved past events"}
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-white/50">
              {filterType === "upcoming"
                ? "Bookmark events you're interested in and they'll appear here."
                : "Past events you bookmarked will show up here."}
            </p>
            {filterType === "upcoming" && (
              <Button
                onClick={() => router.push("/")}
                className="mt-6 rounded-xl bg-white/15 px-6 text-white backdrop-blur-sm hover:bg-white/25 border border-white/20"
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

              return (
                <div
                  key={event.id}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl transition-transform duration-300 hover:-translate-y-1 hover:shadow-black/40"
                  style={{ aspectRatio: "3 / 4" }}
                >
                  {/* Full-bleed image */}
                  <button
                    onClick={() =>
                      router.push(`/${event.citySlug}/${event.slug}`)
                    }
                    className="absolute inset-0 w-full h-full"
                  >
                    <img
                      src={event.image || "/placeholder-event.jpg"}
                      alt={event.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </button>

                  {/* Gradient overlay — bottom heavy */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                  {/* Top-right: price badge */}
                  {event.price && (
                    <div className="absolute top-3 right-3 rounded-full bg-black/40 px-2.5 py-1 backdrop-blur-md border border-white/15">
                      <span className="text-[11px] font-semibold text-white">
                        {event.price}
                      </span>
                    </div>
                  )}

                  {/* Bottom: frosted glass info panel */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">

                    {/* Category pill */}
                    <div className="mb-2">
                      <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/70 backdrop-blur-sm">
                        {event.category}
                      </span>
                    </div>

                    {/* Title */}
                    <button
                      onClick={() =>
                        router.push(`/${event.citySlug}/${event.slug}`)
                      }
                      className="mb-3 block text-left"
                    >
                      <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-white sm:text-[16px]">
                        {event.title}
                      </h3>
                    </button>

                    {/* Frosted glass info row */}
                    <div className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5 backdrop-blur-md">
                      <div className="flex items-center justify-between gap-2">

                        {/* Date + venue */}
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span className="flex items-center gap-1.5 text-[11px] text-white/70">
                            <Calendar className="h-3 w-3 shrink-0 text-white/50" />
                            {formatDate(event.date)} · {formatTime(event.time)}
                          </span>
                          <span className="flex items-center gap-1.5 text-[11px] text-white/70">
                            <MapPin className="h-3 w-3 shrink-0 text-white/50" />
                            <span className="truncate">
                              {event.venue ?? event.city}
                            </span>
                          </span>
                        </div>

                        {/* Remove button */}
                        <button
                          onClick={() =>
                            unsaveMutation.mutate({ eventId: event.id })
                          }
                          disabled={unsaveMutation.isPending}
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/50 transition-colors hover:bg-red-500/40 hover:text-white disabled:opacity-40"
                          aria-label="Remove saved event"
                        >
                          {unsaveMutation.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
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
