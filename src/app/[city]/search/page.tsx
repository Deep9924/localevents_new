// src/app/[city]/search/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search, X, ChevronDown, MapPin, Calendar,
  Tag, DollarSign, Users, Star, RotateCcw,
  ArrowLeft, Clock, Heart, Share2, ExternalLink,
} from "lucide-react";
import { CATEGORIES } from "@/lib/events-data";
import { useCity } from "@/contexts/CityContext";
import { trpc } from "@/lib/trpc";

// ─── Types ────────────────────────────────────────────────────────────────────

type DateFilter   = "any" | "today" | "tomorrow" | "weekend" | "week" | "month";
type PriceFilter  = "any" | "free" | "under10" | "under25" | "under50" | "paid";
type FormatFilter = "any" | "in-person" | "online" | "hybrid";
type SortOption   = "relevance" | "date-asc" | "date-desc" | "price-asc" | "price-desc" | "popular";

interface Filters {
  query: string;
  category: string;
  date: DateFilter;
  price: PriceFilter;
  format: FormatFilter;
  sort: SortOption;
}

const DEFAULT_FILTERS: Filters = {
  query: "",
  category: "all",
  date: "any",
  price: "any",
  format: "any",
  sort: "relevance",
};

// ─── Pill ─────────────────────────────────────────────────────────────────────

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-100 whitespace-nowrap shrink-0
        ${active
          ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
          : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-700"
        }`}
      style={{ fontFamily: "'Sora', sans-serif" }}
    >
      {children}
    </button>
  );
}

// ─── Filter dropdown ──────────────────────────────────────────────────────────

function FilterDropdown({
  label, icon, active, children,
}: {
  label: string; icon: React.ReactNode; active: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 h-9 px-3.5 rounded-full border text-sm font-medium transition-all duration-100
          ${active
            ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
            : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50/40"
          }`}
        style={{ fontFamily: "'Sora', sans-serif" }}
      >
        {icon}
        <span>{label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 min-w-[240px]">
          {children}
          <button
            onClick={() => setOpen(false)}
            className="mt-3 w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Event card ───────────────────────────────────────────────────────────────

interface EventCardProps {
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
}

function EventCard({ id, title, category, date, time, location, price, isFree, imageUrl, attendees, rating, format, citySlug }: EventCardProps) {
  const [saved, setSaved] = useState(false);
  const cat = CATEGORIES.find(c => c.id === category);

  return (
    <Link
      href={`/${citySlug}/events/${id}`}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-200 overflow-hidden flex flex-col"
    >
      {/* Image / placeholder */}
      <div className="relative h-40 bg-gradient-to-br from-indigo-50 to-amber-50 overflow-hidden shrink-0">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">
            {cat?.icon ?? "🎉"}
          </div>
        )}

        {/* Format badge */}
        {format && format !== "in-person" && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-indigo-700 border border-indigo-100">
            {format === "online" ? "🌐 Online" : "🔀 Hybrid"}
          </span>
        )}

        {/* Price badge */}
        <span className={`absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold border
          ${isFree ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white/90 border-gray-200 text-gray-700"}`}>
          {isFree ? "Free" : price}
        </span>

        {/* Save button */}
        <button
          onClick={(e) => { e.preventDefault(); setSaved(v => !v); }}
          className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:bg-white transition-colors"
        >
          <Heart className={`w-4 h-4 transition-colors ${saved ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-1.5 flex-1">
        {/* Category tag */}
        {cat && (
          <span className="text-[11px] font-semibold text-indigo-500 uppercase tracking-wide">
            {cat.icon} {cat.label}
          </span>
        )}

        <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-indigo-700 transition-colors" style={{ fontFamily: "'Sora', sans-serif" }}>
          {title}
        </h3>

        <div className="flex flex-col gap-1 mt-0.5">
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            {date} · {time}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500 truncate">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="truncate">{location}</span>
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-2">
          {attendees ? (
            <span className="text-[11px] text-gray-400">
              <Users className="w-3 h-3 inline mr-0.5" />
              {attendees.toLocaleString()} going
            </span>
          ) : <span />}
          {rating ? (
            <span className="flex items-center gap-0.5 text-[11px] font-semibold text-amber-500">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {rating}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

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

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { citySlug, cityName, setCitySlug } = useCity();
  const { data: cityCounts = {} } = trpc.events.getCountByCity.useQuery();

  const shouldFocus = searchParams.get("focus") === "1";
  const inputRef = useRef<HTMLInputElement>(null);

  // Universal filters — fixed, not derived from results
  const [filters, setFilters] = useState<Filters>({
    query:    searchParams.get("search")   ?? "",
    category: searchParams.get("category") ?? "all",
    date:    (searchParams.get("date")     as DateFilter)   ?? "any",
    price:   (searchParams.get("price")    as PriceFilter)  ?? "any",
    format:  (searchParams.get("format")   as FormatFilter) ?? "any",
    sort:    (searchParams.get("sort")     as SortOption)   ?? "relevance",
  });

  // Only show results after explicit search action
  const [hasSearched, setHasSearched] = useState(
    Boolean(searchParams.get("search") && !shouldFocus)
  );
  const [isLoading, setIsLoading] = useState(false);

  const setFilter = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const activeFilterCount = useMemo(() => [
    filters.category !== "all",
    filters.date !== "any",
    filters.price !== "any",
    filters.format !== "any",
  ].filter(Boolean).length, [filters]);

  // Autofocus
  useEffect(() => {
    if (shouldFocus) setTimeout(() => inputRef.current?.focus(), 80);
  }, [shouldFocus]);

  const handleSearch = useCallback(() => {
    if (!filters.query.trim() && activeFilterCount === 0) return;
    // Update URL
    const params = new URLSearchParams();
    if (filters.query.trim()) params.set("search", filters.query.trim());
    if (filters.category !== "all") params.set("category", filters.category);
    if (filters.date !== "any") params.set("date", filters.date);
    if (filters.price !== "any") params.set("price", filters.price);
    if (filters.format !== "any") params.set("format", filters.format);
    params.set("sort", filters.sort);
    router.replace(`/${citySlug}/search?${params.toString()}`);

    // Simulate loading (replace with real tRPC call)
    setIsLoading(true);
    setHasSearched(true);
    setTimeout(() => setIsLoading(false), 700);
  }, [filters, activeFilterCount, citySlug, router]);

  // Keyboard shortcut ⌘K from anywhere on the page
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const resetFilters = () => {
    setFilters({ ...DEFAULT_FILTERS, query: filters.query });
  };

  // ── Mock events — replace with tRPC query result ──
  // const { data: events = [], isLoading } = trpc.events.search.useQuery(
  //   { ...filters, citySlug }, { enabled: hasSearched }
  // );
  const mockEvents: EventCardProps[] = hasSearched && !isLoading ? [
    { id: "1", title: "Jazz Night at The Rooftop", category: "music", date: "Sat Mar 29", time: "8:00 PM", location: "The Rooftop Bar", price: "$15", isFree: false, attendees: 120, rating: 4.8, format: "in-person", citySlug },
    { id: "2", title: "Modern Art Exhibition Opening", category: "arts", date: "Sun Mar 30", time: "6:00 PM", location: "City Gallery", price: "Free", isFree: true, attendees: 340, rating: 4.6, format: "in-person", citySlug },
    { id: "3", title: "React Advanced Workshop", category: "tech", date: "Mon Mar 31", time: "10:00 AM", location: "Online", price: "$49", isFree: false, attendees: 85, format: "online", citySlug },
    { id: "4", title: "Sunday Farmers Market", category: "food", date: "Sun Mar 30", time: "9:00 AM", location: "Central Park Plaza", price: "Free", isFree: true, attendees: 600, rating: 4.9, format: "in-person", citySlug },
    { id: "5", title: "Beginner Yoga in the Park", category: "sports", date: "Sat Mar 29", time: "7:00 AM", location: "Riverside Park", price: "Free", isFree: true, attendees: 45, format: "in-person", citySlug },
    { id: "6", title: "Startup Pitch Night", category: "business", date: "Tue Apr 1", time: "6:30 PM", location: "Innovation Hub", price: "$10", isFree: false, attendees: 200, rating: 4.5, format: "hybrid", citySlug },
  ] : [];

  const visibleCats = CATEGORIES.slice(0, 6);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Mini navbar for search page ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-14 gap-3">

            {/* Back */}
            <button
              onClick={() => router.back()}
              className="p-2 -ml-1 text-gray-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all duration-100 shrink-0"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Search input — no icon inside */}
            <div className="flex-1 flex items-center h-10 px-4 rounded-full border border-gray-200 bg-gray-50 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:bg-white transition-all duration-200">
              <input
                ref={inputRef}
                type="text"
                placeholder={`Search events in ${cityName}…`}
                value={filters.query}
                onChange={e => setFilter("query", e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
                className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
              />
              {filters.query && (
                <button
                  onClick={() => { setFilter("query", ""); inputRef.current?.focus(); }}
                  className="ml-1 p-0.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors shrink-0"
                  tabIndex={-1}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Search button */}
            <button
              onClick={handleSearch}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white transition-all duration-100 shrink-0 shadow-sm"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* City pill — desktop */}
            <button
              onClick={() => router.push(`/${citySlug}`)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-sm font-medium text-gray-600 shrink-0"
            >
              <MapPin className="w-3.5 h-3.5 text-indigo-500" />
              <span>{cityName}</span>
            </button>
          </div>

          {/* ── Universal filter row — always shown, never changes ── */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-3">

            {/* Category */}
            <FilterDropdown
              label={filters.category === "all" ? "Category" : (CATEGORIES.find(c => c.id === filters.category)?.label ?? filters.category)}
              icon={<Tag className="w-3.5 h-3.5" />}
              active={filters.category !== "all"}
            >
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Category</p>
              <div className="flex flex-wrap gap-1.5">
                <Pill active={filters.category === "all"} onClick={() => setFilter("category", "all")}>All</Pill>
                {CATEGORIES.map(cat => (
                  <Pill key={cat.id} active={filters.category === cat.id} onClick={() => setFilter("category", cat.id)}>
                    {cat.icon} {cat.label}
                  </Pill>
                ))}
              </div>
            </FilterDropdown>

            {/* Date */}
            <FilterDropdown
              label={filters.date === "any" ? "Date" : { today: "Today", tomorrow: "Tomorrow", weekend: "Weekend", week: "This week", month: "This month" }[filters.date] ?? filters.date}
              icon={<Calendar className="w-3.5 h-3.5" />}
              active={filters.date !== "any"}
            >
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">When</p>
              <div className="flex flex-wrap gap-1.5">
                {([
                  { id: "any", label: "Any time" },
                  { id: "today", label: "Today" },
                  { id: "tomorrow", label: "Tomorrow" },
                  { id: "weekend", label: "Weekend" },
                  { id: "week", label: "This week" },
                  { id: "month", label: "This month" },
                ] as { id: DateFilter; label: string }[]).map(d => (
                  <Pill key={d.id} active={filters.date === d.id} onClick={() => setFilter("date", d.id)}>{d.label}</Pill>
                ))}
              </div>
            </FilterDropdown>

            {/* Price */}
            <FilterDropdown
              label={filters.price === "any" ? "Price" : { free: "Free", under10: "< $10", under25: "< $25", under50: "< $50", paid: "Paid" }[filters.price] ?? filters.price}
              icon={<DollarSign className="w-3.5 h-3.5" />}
              active={filters.price !== "any"}
            >
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Price</p>
              <div className="flex flex-wrap gap-1.5">
                {([
                  { id: "any", label: "Any" },
                  { id: "free", label: "Free" },
                  { id: "under10", label: "Under $10" },
                  { id: "under25", label: "Under $25" },
                  { id: "under50", label: "Under $50" },
                  { id: "paid", label: "Paid" },
                ] as { id: PriceFilter; label: string }[]).map(p => (
                  <Pill key={p.id} active={filters.price === p.id} onClick={() => setFilter("price", p.id)}>{p.label}</Pill>
                ))}
              </div>
            </FilterDropdown>

            {/* Format */}
            <FilterDropdown
              label={filters.format === "any" ? "Format" : { "in-person": "In-person", online: "Online", hybrid: "Hybrid" }[filters.format] ?? filters.format}
              icon={<Users className="w-3.5 h-3.5" />}
              active={filters.format !== "any"}
            >
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Format</p>
              <div className="flex flex-wrap gap-1.5">
                {([
                  { id: "any", label: "Any" },
                  { id: "in-person", label: "In-person" },
                  { id: "online", label: "Online" },
                  { id: "hybrid", label: "Hybrid" },
                ] as { id: FormatFilter; label: string }[]).map(f => (
                  <Pill key={f.id} active={filters.format === f.id} onClick={() => setFilter("format", f.id)}>{f.label}</Pill>
                ))}
              </div>
            </FilterDropdown>

            {/* Sort */}
            <FilterDropdown
              label={{ relevance: "Relevance", "date-asc": "Earliest", "date-desc": "Latest", "price-asc": "Cheapest", "price-desc": "Priciest", popular: "Popular" }[filters.sort] ?? "Sort"}
              icon={<Clock className="w-3.5 h-3.5" />}
              active={filters.sort !== "relevance"}
            >
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Sort by</p>
              <div className="flex flex-wrap gap-1.5">
                {([
                  { id: "relevance", label: "Relevance" },
                  { id: "date-asc", label: "Date ↑" },
                  { id: "date-desc", label: "Date ↓" },
                  { id: "price-asc", label: "Price ↑" },
                  { id: "price-desc", label: "Price ↓" },
                  { id: "popular", label: "Popular" },
                ] as { id: SortOption; label: string }[]).map(s => (
                  <Pill key={s.id} active={filters.sort === s.id} onClick={() => setFilter("sort", s.id)}>{s.label}</Pill>
                ))}
              </div>
            </FilterDropdown>

            {/* Reset */}
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 h-9 px-3 rounded-full border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* Pre-search state */}
        {!hasSearched && (
          <div className="space-y-8">
            {/* Hero prompt */}
            <div className="text-center py-10">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 flex items-center justify-center mb-4 shadow-sm">
                <Search className="w-7 h-7 text-indigo-400" />
              </div>
              <h1 className="text-xl font-bold text-gray-800 mb-1" style={{ fontFamily: "'Sora', sans-serif" }}>
                Find your next experience
              </h1>
              <p className="text-sm text-gray-400 max-w-xs mx-auto">
                Search or pick a category to discover events happening in {cityName}.
              </p>
            </div>

            {/* Category shortcuts */}
            <div>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3" style={{ fontFamily: "'Sora', sans-serif" }}>
                Browse by category
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { setFilter("category", cat.id); handleSearch(); }}
                    className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/40 hover:shadow-sm active:scale-95 transition-all duration-150"
                  >
                    <span className="text-2xl">{cat.icon}</span>
                    <span className="text-xs font-semibold text-gray-600 text-center leading-tight" style={{ fontFamily: "'Sora', sans-serif" }}>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Results */}
        {hasSearched && !isLoading && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-gray-800">{mockEvents.length}</span> event{mockEvents.length !== 1 ? "s" : ""} found
                {filters.query && <> for <span className="font-semibold text-gray-800">"{filters.query}"</span></>}
              </p>
              {mockEvents.length > 0 && (
                <span className="text-xs text-gray-400">{cityName}</span>
              )}
            </div>

            {mockEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <Search className="w-7 h-7 text-gray-300" />
                </div>
                <h2 className="text-lg font-bold text-gray-600 mb-1" style={{ fontFamily: "'Sora', sans-serif" }}>
                  No events found
                </h2>
                <p className="text-sm text-gray-400 max-w-xs mb-4">
                  Try different keywords or broaden your filters.
                </p>
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockEvents.map(event => (
                  <EventCard key={event.id} {...event} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
