"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar, Heart, MapPin, Star, Users } from "lucide-react";
import { CATEGORIES } from "@/lib/events-data";
import { useCity } from "@/contexts/CityContext";
import { trpc } from "@/lib/trpc";
import SearchNavbar from "@/components/SearchNavbar";

type EventCardProps = {
  id: string;
  title: string;
  category: string;
  date: string;
  time: string;
  location: string;
  price: string;
  isFree: boolean;
  imageUrl?: string;
  attendees?: number;
  rating?: number;
  format?: string;
  citySlug: string;
};

function EventCard({ id, title, category, date, time, location, price, isFree, imageUrl, attendees, rating, format, citySlug }: EventCardProps) {
  const [saved, setSaved] = useState(false);
  const cat = CATEGORIES.find(c => c.id === category);

  return (
    <Link href={`/${citySlug}/events/${id}`} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-200 overflow-hidden flex flex-col">
      <div className="relative h-40 bg-gradient-to-br from-indigo-50 to-amber-50 overflow-hidden shrink-0">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">{cat?.icon ?? "🎉"}</div>
        )}
        {format && format !== "in-person" && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-indigo-700 border border-indigo-100">
            {format === "online" ? "🌐 Online" : "🔀 Hybrid"}
          </span>
        )}
        <span className={`absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${isFree ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white/90 border-gray-200 text-gray-700"}`}>
          {isFree ? "Free" : price}
        </span>
        <button onClick={(e) => { e.preventDefault(); setSaved(v => !v); }} className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:bg-white transition-colors">
          <Heart className={`w-4 h-4 transition-colors ${saved ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-1.5 flex-1">
        {cat && <span className="text-[11px] font-semibold text-indigo-500 uppercase tracking-wide">{cat.icon} {cat.label}</span>}
        <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-indigo-700 transition-colors" style={{ fontFamily: "'Sora', sans-serif" }}>{title}</h3>
        <div className="flex flex-col gap-1 mt-0.5">
          <span className="flex items-center gap-1.5 text-xs text-gray-500"><Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />{date} · {time}</span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500 truncate"><MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" /><span className="truncate">{location}</span></span>
        </div>
        <div className="flex items-center justify-between mt-auto pt-2">
          {attendees ? <span className="text-[11px] text-gray-400"><Users className="w-3 h-3 inline mr-0.5" />{attendees.toLocaleString()} going</span> : <span />}
          {rating ? <span className="flex items-center gap-0.5 text-[11px] font-semibold text-amber-500"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{rating}</span> : null}
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-40 bg-gray-100" />
      <div className="p-4 space-y-2.5">
        <div className="h-2.5 bg-gray-100 rounded-full w-1/4" />
        <div className="h-4 bg-gray-100 rounded-full w-3/4" />
        <div className="h-3 bg-gray-100 rounded-full w-1/2" />
        <div className="h-3 bg-gray-100 rounded-full w-2/5" />
      </div>
    </div>
  );
}

export default function SearchPage() {
  const router = useRouter();
  const { citySlug } = useCity();
  const { data: cityCounts = {} } = trpc.events.getCountByCity.useQuery();

  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const mockEvents: EventCardProps[] = hasSearched && !isLoading ? [
    { id: "1", title: "Jazz Night at The Rooftop", category: "music", date: "Sat Mar 29", time: "8:00 PM", location: "The Rooftop Bar", price: "$15", isFree: false, attendees: 120, rating: 4.8, format: "in-person", citySlug },
    { id: "2", title: "Modern Art Exhibition Opening", category: "arts", date: "Sun Mar 30", time: "6:00 PM", location: "City Gallery", price: "Free", isFree: true, attendees: 340, rating: 4.6, format: "in-person", citySlug },
    { id: "3", title: "React Advanced Workshop", category: "tech", date: "Mon Mar 31", time: "10:00 AM", location: "Online", price: "$49", isFree: false, attendees: 85, format: "online", citySlug },
    { id: "4", title: "Sunday Farmers Market", category: "food", date: "Sun Mar 30", time: "9:00 AM", location: "Central Park Plaza", price: "Free", isFree: true, attendees: 600, rating: 4.9, format: "in-person", citySlug },
    { id: "5", title: "Beginner Yoga in the Park", category: "sports", date: "Sat Mar 29", time: "7:00 AM", location: "Riverside Park", price: "Free", isFree: true, attendees: 45, format: "in-person", citySlug },
    { id: "6", title: "Startup Pitch Night", category: "business", date: "Tue Apr 1", time: "6:30 PM", location: "Innovation Hub", price: "$10", isFree: false, attendees: 200, rating: 4.5, format: "hybrid", citySlug },
  ] : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <SearchNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : hasSearched ? (
          mockEvents.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mockEvents.map((event) => <EventCard key={event.id} {...event} />)}
            </div>
          ) : (
            <div className="py-16 text-center text-gray-500">No events found.</div>
          )
        ) : (
          <div className="py-16 text-center text-gray-500">Search to see events.</div>
        )}
      </main>
    </div>
  );
}
