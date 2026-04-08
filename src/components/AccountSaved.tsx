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
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }
  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
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
                Events you've bookmarked
              </p>
            </div>
          </div>

          {/* Row 2: full-width pill tabs */}
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
      <div className="mx-auto max-w-2xl px-4 py-6 pb-16 sm:px-6">
        {eventsLoading ? (
          <div className="flex flex-col gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-3xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
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
          <div className="flex flex-col gap-5">
            {filteredEvents.map((savedEvent: SavedEventWithNonNullEvent) => {
              const event = savedEvent.event;

              return (
                <div
                  key={event.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* ── Hero image ── */}
                  <button
                    onClick={() =>
                      router.push(`/${event.citySlug}/${event.slug}`)
                    }
                    className="group relative block w-full overflow-hidden"
                  >
                    <div className="relative h-48 w-full sm:h-52">
                      <img
                        src={event.image || "/placeholder-event.jpg"}
                        alt={event.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  </button>

                  {/* ── Event info ── */}
                  <div className="px-5 pt-4 pb-3">
                    <h3 className="text-[16px] font-bold leading-snug text-slate-900">
                      {event.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {event.city} · {event.category}
                    </p>

                    <div className="mt-3 flex flex-col gap-1.5">
                      <span className="flex items-center gap-1.5 text-[12px] text-slate-500">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        {formatDate(event.date)} · {formatTime(event.time)}
                      </span>
                      <span className="flex items-center gap-1.5 text-[12px] text-slate-500">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">
                          {event.venue ?? event.city}
                        </span>
                      </span>
                    </div>

                    {/* Price pill */}
                    <div className="mt-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-[12px] font-medium text-blue-700">
                        <Bookmark className="h-3 w-3" />
                        Saved
                      </div>
                      {event.price && (
                        <span className="text-[13px] font-semibold text-slate-700">
                          {event.price}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ── Separator ── */}
                  <div className="mx-5 border-t border-slate-100" />

                  {/* ── Action buttons ── */}
                  <div className="grid grid-cols-2 gap-2 px-5 pt-3 pb-5">
                    <button
                      onClick={() =>
                        router.push(`/${event.citySlug}/${event.slug}`)
                      }
                      className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 py-3 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900"
                    >
                      View details →
                    </button>
                    <button
                      onClick={() =>
                        unsaveMutation.mutate({ eventId: event.id })
                      }
                      disabled={unsaveMutation.isPending}
                      className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 py-3 text-[13px] font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      {unsaveMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      Remove
                    </button>
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
