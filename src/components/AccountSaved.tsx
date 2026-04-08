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
  MoreVertical,
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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }
  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen bg-white">

      {/* ── Header ── */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">

          {/* Row 1: back + title */}
          <div className="flex items-center gap-3 py-3">
            <button
              onClick={() => router.push("/account/profile")}
              className="rounded-full p-1.5 transition-colors hover:bg-slate-100"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-[17px] font-semibold leading-tight text-slate-900">
                Saved Events
              </h1>
              <p className="text-[12px] text-slate-400">
                {filteredEvents.length > 0
                  ? `${filteredEvents.length} event${filteredEvents.length !== 1 ? "s" : ""}`
                  : "Events you've bookmarked"}
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
      </div>

      {/* ── Content ── */}
      <div className="mx-auto max-w-2xl px-0 sm:px-0 pb-16">

        {eventsLoading ? (
          /* ── Skeletons ── */
          <div className="flex flex-col">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3 px-4 py-3 sm:px-6">
                {/* Thumbnail skeleton */}
                <div className="h-[94px] w-[168px] flex-shrink-0 animate-pulse rounded-xl bg-slate-100 sm:h-[101px] sm:w-[180px]" />
                {/* Text skeleton */}
                <div className="flex flex-1 flex-col gap-2 pt-1">
                  <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>

        ) : filteredEvents.length === 0 ? (
          /* ── Empty state ── */
          <div className="px-4 py-16 text-center sm:px-6">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <Bookmark className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              {filterType === "upcoming"
                ? "No saved upcoming events"
                : "No saved past events"}
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
              {filterType === "upcoming"
                ? "Bookmark events you're interested in and they'll appear here."
                : "Past events you bookmarked will show up here."}
            </p>
            {filterType === "upcoming" && (
              <Button
                onClick={() => router.push("/")}
                className="mt-6 rounded-xl bg-slate-900 px-6 hover:bg-slate-700"
              >
                Explore Events
              </Button>
            )}
          </div>

        ) : (
          /* ── Watch Later style rows ── */
          <div className="flex flex-col pt-2">
            {filteredEvents.map((savedEvent: SavedEventWithNonNullEvent) => {
              const event = savedEvent.event;
              const isMenuOpen = openMenuId === event.id;

              return (
                <div
                  key={event.id}
                  className="group relative flex gap-3 px-4 py-3 transition-colors hover:bg-slate-50 sm:gap-4 sm:px-6"
                  // Close menu on outside interaction
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      setOpenMenuId(null);
                    }
                  }}
                >
                  {/* ── Thumbnail ── */}
                  <button
                    onClick={() =>
                      router.push(`/${event.citySlug}/${event.slug}`)
                    }
                    className="relative flex-shrink-0 overflow-hidden rounded-xl"
                  >
                    {/* 16:9 thumbnail — 168px wide on mobile, 180px on sm+ */}
                    <div className="h-[94px] w-[168px] sm:h-[101px] sm:w-[180px]">
                      <img
                        src={event.image || "/placeholder-event.jpg"}
                        alt={event.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    {/* Price chip on thumbnail */}
                    {event.price && (
                      <span className="absolute bottom-1.5 right-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        {event.price}
                      </span>
                    )}
                  </button>

                  {/* ── Info ── */}
                  <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                    <div className="min-w-0 pr-8">
                      {/* Title */}
                      <button
                        onClick={() =>
                          router.push(`/${event.citySlug}/${event.slug}`)
                        }
                        className="text-left"
                      >
                        <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-slate-900 hover:text-slate-600 transition-colors sm:text-[14px]">
                          {event.title}
                        </h3>
                      </button>

                      {/* City · Category */}
                      <p className="mt-1 text-[11px] text-slate-400">
                        {event.city} · {event.category}
                      </p>

                      {/* Date */}
                      <span className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-500">
                        <Calendar className="h-2.5 w-2.5 shrink-0 text-slate-400" />
                        {formatDate(event.date)} · {formatTime(event.time)}
                      </span>

                      {/* Venue */}
                      <span className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                        <MapPin className="h-2.5 w-2.5 shrink-0 text-slate-400" />
                        <span className="truncate">{event.venue ?? event.city}</span>
                      </span>
                    </div>
                  </div>

                  {/* ── Three-dot menu (top-right of row) ── */}
                  <div className="absolute right-4 top-3 sm:right-6">
                    <button
                      onClick={() =>
                        setOpenMenuId(isMenuOpen ? null : event.id)
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-700 focus:opacity-100"
                      aria-label="More options"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {/* Dropdown */}
                    {isMenuOpen && (
                      <div className="absolute right-0 top-9 z-20 min-w-[160px] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                        <button
                          onClick={() =>
                            router.push(`/${event.citySlug}/${event.slug}`)
                          }
                          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50"
                        >
                          View event
                        </button>
                        <button
                          onClick={() => {
                            unsaveMutation.mutate({ eventId: event.id });
                            setOpenMenuId(null);
                          }}
                          disabled={unsaveMutation.isPending}
                          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          {unsaveMutation.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          Remove from saved
                        </button>
                      </div>
                    )}
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
