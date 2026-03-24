// src/components/AccountSaved.tsx
"use client";

import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, Bookmark, MapPin, Calendar, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { formatDate, formatTime } from "@/lib/utils";
import type { AppRouter } from "@/server/routers";
import type { inferRouterOutputs } from "@trpc/server";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type SavedEventWithEvent = RouterOutputs["savedEvents"]["list"][number];

type FilterType = "all" | "upcoming" | "past";

export default function AccountSaved() {
  const { user, loading: authLoading, isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const router = useRouter();
  const [filterType, setFilterType] = useState<FilterType>("upcoming");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const { data: savedEvents = [], isLoading: eventsLoading } = trpc.savedEvents.list.useQuery(
    undefined, { enabled: isAuthenticated && !!user }
  );

  const utils = trpc.useUtils();
  const unsaveMutation = trpc.savedEvents.unsave.useMutation({
    onSuccess: () => utils.savedEvents.list.invalidate(),
  });

  const filteredEvents = useMemo(() => {
    const now = new Date();
    let filtered = savedEvents.filter((item): item is SavedEventWithEvent & { event: NonNullable<SavedEventWithEvent["event"]> } => item.event !== null);
    
    if (selectedCity) {
      filtered = filtered.filter((item) => item.event.city === selectedCity);
    }
    
    if (filterType === "upcoming") {
      filtered = filtered.filter((item) => new Date(`${item.event.date}T${item.event.time || "00:00"}`) >= now);
    } else if (filterType === "past") {
      filtered = filtered.filter((item) => new Date(`${item.event.date}T${item.event.time || "00:00"}`) < now);
    }
    
    return filtered.sort((a, b) => 
      new Date(`${a.event.date}T${a.event.time}`).getTime() - new Date(`${b.event.date}T${b.event.time}`).getTime()
    );
  }, [savedEvents, filterType, selectedCity]);

  const cities = useMemo(() => {
    const citySet = new Set<string>();
    savedEvents.forEach((item) => {
      if (item.event?.city) {
        citySet.add(item.event.city);
      }
    });
    return Array.from(citySet).sort();
  }, [savedEvents]);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="border-b border-slate-200 bg-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.push("/account/profile")} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><ArrowLeft className="w-5 h-5 text-slate-600" /></button>
          <div><h1 className="text-2xl font-bold text-slate-900">Saved Events</h1><p className="text-sm text-slate-600">{filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}</p></div>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-white sticky top-16 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
          <div className="flex gap-2 flex-wrap">
            {(["upcoming", "past", "all"] as const).map((type) => (
              <button key={type} onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filterType === type ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                {type === "upcoming" ? "Upcoming" : type === "past" ? "Past" : "All Events"}
              </button>
            ))}
          </div>
          {cities.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setSelectedCity(null)} className={`px-3 py-1 rounded-full text-sm ${selectedCity === null ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-700"}`}>All Cities</button>
              {cities.map((city) => (
                <button key={city} onClick={() => setSelectedCity(city)} className={`px-3 py-1 rounded-full text-sm capitalize ${selectedCity === city ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-700"}`}>{city}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {eventsLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <Bookmark className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No saved events</h3>
            <Button onClick={() => router.push("/")} className="bg-indigo-600 hover:bg-indigo-700">Browse Events</Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredEvents.map((savedEvent) => {
              const event = savedEvent.event;
              const isPast = new Date(`${event.date}T${event.time}`) < new Date();
              return (
                <Card key={event.id} className={`overflow-hidden hover:shadow-lg transition-shadow ${isPast ? "opacity-75" : ""}`}>
                  <div className="flex gap-4 p-4">
                    {event.image && <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0"><img src={event.image} alt={event.title} className="w-full h-full object-cover" /></div>}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div><h3 className="text-lg font-semibold text-slate-900 truncate">{event.title}</h3><p className="text-sm text-slate-600 capitalize">{event.category}</p></div>
                        {isPast && <span className="px-2 py-1 bg-slate-200 text-slate-700 text-xs font-medium rounded whitespace-nowrap">Past</span>}
                      </div>
                      <div className="space-y-1 text-sm text-slate-600 mb-4">
                        <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /><span>{formatDate(event.date)}</span></div>
                        <div className="flex items-center gap-2"><Clock className="w-4 h-4" /><span>{formatTime(event.time)}</span></div>
                        <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /><span>{event.venue}</span></div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => router.push(`/${event.citySlug}/${event.slug}`)} variant="outline" size="sm" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">View Details</Button>
                        <Button onClick={() => unsaveMutation.mutate({ eventId: event.id })} disabled={unsaveMutation.isPending} variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                          {unsaveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Remove"}
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
