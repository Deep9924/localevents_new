// src/app/[citySlug]/search/page.tsx
//
// ROUTING OPTIONS — pick one:
//
// A) Per-city route (recommended):
//    File: src/app/[citySlug]/search/page.tsx
//    URL:  /london/search?search=jazz&category=music
//
// B) Global /search route:
//    File: src/app/search/page.tsx
//    URL:  /search?search=jazz&city=london
//    Then read `city` from searchParams and feed into useCity or pass as prop.
//
// C) Hash-based (#search) — not a real page, just scroll-to or modal.
//    Open a <SearchModal> component from Navbar on "#search" link click.
//    No separate page needed.
//
// This file implements option A. To use option B just move the file and
// add `const citySlug = searchParams.city ?? "london"` at the top.

"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search, SlidersHorizontal, X, ChevronDown,
  MapPin, Calendar, Tag, DollarSign, Users,
  Star, Check, RotateCcw, ArrowLeft,
} from "lucide-react";
import { CATEGORIES } from "@/lib/events-data";
import { useCity } from "@/contexts/CityContext";
import { trpc } from "@/lib/trpc";

// ─── Types ────────────────────────────────────────────────────────────────────

type DateFilter  = "any" | "today" | "tomorrow" | "weekend" | "week" | "month" | "custom";
type PriceFilter = "any" | "free" | "paid" | "under10" | "under25" | "under50";
type FormatFilter = "any" | "in-person" | "online" | "hybrid";
type SortOption  = "relevance" | "date-asc" | "date-desc" | "price-asc" | "price-desc" | "popular";

interface Filters {
  query: string;
  category: string;
  date: DateFilter;
  dateFrom: string;
  dateTo: string;
  price: PriceFilter;
  format: FormatFilter;
  distance: number;
  minRating: number;
  sort: SortOption;
}

const DEFAULT_FILTERS: Filters = {
  query: "",
  category: "all",
  date: "any",
  dateFrom: "",
  dateTo: "",
  price: "any",
  format: "any",
  distance: 50,
  minRating: 0,
  sort: "relevance",
};

// ─── Pill button ──────────────────────────────────────────────────────────────

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

// ─── Active chip ──────────────────────────────────────────────────────────────

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium whitespace-nowrap shrink-0">
      {label}
      <button
        onClick={onRemove}
        className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-indigo-200 transition-colors"
      >
        <X className="w-2.5 h-2.5" />
      </button>
    </span>
  );
}

// ─── Filter dropdown ──────────────────────────────────────────────────────────

function FilterDropdown({
  label,
  icon,
  active,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 h-9 px-3 rounded-full border text-sm font-medium transition-all duration-100
          ${active
            ? "bg-indigo-600 border-indigo-600 text-white"
            : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-700"
          }`}
        style={{ fontFamily: "'Sora', sans-serif" }}
      >
        {icon}
        <span>{label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 min-w-[260px] max-w-[320px]">
          {children}
          <button
            onClick={() => setOpen(false)}
            className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            <Check className="w-3.5 h-3.5" /> Done
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { citySlug, cityName } = useCity();

  // Auto-focus signal from Navbar
  const shouldFocus = searchParams.get("focus") === "1";
  const inputRef = useRef<HTMLInputElement>(null);

  const [filters, setFilters] = useState<Filters>({
    ...DEFAULT_FILTERS,
    query: searchParams.get("search") ?? "",
    category: searchParams.get("category") ?? "all",
    date: (searchParams.get("date") as DateFilter) ?? "any",
    price: (searchParams.get("price") as PriceFilter) ?? "any",
    format: (searchParams.get("format") as FormatFilter) ?? "any",
    sort: (searchParams.get("sort") as SortOption) ?? "relevance",
  });

  const [submitted, setSubmitted] = useState(!shouldFocus); // show results immediately if not fresh focus

  // Autofocus on mount when coming from navbar click
  useEffect(() => {
    if (shouldFocus) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [shouldFocus]);

  const setFilter = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = () =>
    setFilters({ ...DEFAULT_FILTERS, query: filters.query });

  const activeFilterCount = useMemo(() => [
    filters.category !== "all",
    filters.date !== "any",
    filters.price !== "any",
    filters.format !== "any",
    filters.distance !== 50,
    filters.minRating > 0,
  ].filter(Boolean).length, [filters]);

  // Push filters to URL and trigger result display
  const handleSearch = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.query.trim()) params.set("search", filters.query.trim());
    if (filters.category !== "all") params.set("category", filters.category);
    if (filters.date !== "any") params.set("date", filters.date);
    if (filters.price !== "any") params.set("price", filters.price);
    if (filters.format !== "any") params.set("format", filters.format);
    if (filters.distance !== 50) params.set("distance", String(filters.distance));
    if (filters.minRating > 0) params.set("rating", String(filters.minRating));
    params.set("sort", filters.sort);
    router.replace(`/${citySlug}/search?${params.toString()}`);
    setSubmitted(true);
  }, [filters, citySlug, router]);

  // Re-search whenever a filter chip changes (except raw query typing)
  const handleFilterChange = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilter(key, value);
    if (submitted) {
      // Defer so state is updated first
      setTimeout(() => handleSearch(), 0);
    }
  };

  // Wire up your tRPC events query here — using filters as input
  // const { data: events, isLoading } = trpc.events.search.useQuery({ ...filters, citySlug }, { enabled: submitted });
  const events: unknown[] = []; // placeholder
  const isLoading = false;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Sticky search + filter row ── */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 space-y-2">

          {/* Row 1: back + input + search button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg transition-colors shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex-1 flex items-center gap-2 h-10 px-4 rounded-full border border-gray-200 bg-gray-50 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:bg-white transition-all">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder={`Search events in ${cityName}…`}
                value={filters.query}
                onChange={(e) => setFilter("query", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                  if (e.key === "Escape") (e.target as HTMLInputElement).blur();
                }}
                className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
              />
              {filters.query && (
                <button
                  onClick={() => { setFilter("query", ""); inputRef.current?.focus(); }}
                  className="p-0.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors shrink-0"
                  tabIndex={-1}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={handleSearch}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white transition-all duration-100 shrink-0 shadow-sm"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          {/* Row 2: horizontal filter pills (single scrollable row) */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">

            {/* Category */}
            <FilterDropdown
              label={filters.category === "all" ? "Category" : (CATEGORIES.find(c => c.id === filters.category)?.label ?? filters.category)}
              icon={<Tag className="w-3.5 h-3.5" />}
              active={filters.category !== "all"}
            >
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Category</p>
              <div className="flex flex-wrap gap-1.5">
                <Pill active={filters.category === "all"} onClick={() => handleFilterChange("category", "all")}>All</Pill>
                {CATEGORIES.map((cat) => (
                  <Pill key={cat.id} active={filters.category === cat.id} onClick={() => handleFilterChange("category", cat.id)}>
                    {cat.icon} {cat.label}
                  </Pill>
                ))}
              </div>
            </FilterDropdown>

            {/* Date */}
            <FilterDropdown
              label={filters.date === "any" ? "Date" : filters.date === "custom" ? "Custom" : filters.date.charAt(0).toUpperCase() + filters.date.slice(1)}
              icon={<Calendar className="w-3.5 h-3.5" />}
              active={filters.date !== "any"}
            >
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Date</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {([
                  { id: "any", label: "Any time" },
                  { id: "today", label: "Today" },
                  { id: "tomorrow", label: "Tomorrow" },
                  { id: "weekend", label: "Weekend" },
                  { id: "week", label: "This week" },
                  { id: "month", label: "This month" },
                  { id: "custom", label: "Custom…" },
                ] as { id: DateFilter; label: string }[]).map((d) => (
                  <Pill key={d.id} active={filters.date === d.id} onClick={() => handleFilterChange("date", d.id)}>
                    {d.label}
                  </Pill>
                ))}
              </div>
              {filters.date === "custom" && (
                <div className="flex gap-2 mt-1">
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-400 font-semibold block mb-1">From</label>
                    <input type="date" value={filters.dateFrom} onChange={(e) => setFilter("dateFrom", e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-400 font-semibold block mb-1">To</label>
                    <input type="date" value={filters.dateTo} onChange={(e) => setFilter("dateTo", e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-400" />
                  </div>
                </div>
              )}
            </FilterDropdown>

            {/* Price */}
            <FilterDropdown
              label={filters.price === "any" ? "Price" : filters.price === "free" ? "Free" : filters.price}
              icon={<DollarSign className="w-3.5 h-3.5" />}
              active={filters.price !== "any"}
            >
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Price</p>
              <div className="flex flex-wrap gap-1.5">
                {([
                  { id: "any", label: "Any price" },
                  { id: "free", label: "Free" },
                  { id: "paid", label: "Paid" },
                  { id: "under10", label: "Under $10" },
                  { id: "under25", label: "Under $25" },
                  { id: "under50", label: "Under $50" },
                ] as { id: PriceFilter; label: string }[]).map((p) => (
                  <Pill key={p.id} active={filters.price === p.id} onClick={() => handleFilterChange("price", p.id)}>
                    {p.label}
                  </Pill>
                ))}
              </div>
            </FilterDropdown>

            {/* Format */}
            <FilterDropdown
              label={filters.format === "any" ? "Format" : filters.format}
              icon={<Users className="w-3.5 h-3.5" />}
              active={filters.format !== "any"}
            >
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Format</p>
              <div className="flex flex-wrap gap-1.5">
                {([
                  { id: "any", label: "Any format" },
                  { id: "in-person", label: "In-person" },
                  { id: "online", label: "Online" },
                  { id: "hybrid", label: "Hybrid" },
                ] as { id: FormatFilter; label: string }[]).map((f) => (
                  <Pill key={f.id} active={filters.format === f.id} onClick={() => handleFilterChange("format", f.id)}>
                    {f.label}
                  </Pill>
                ))}
              </div>
            </FilterDropdown>

            {/* Distance */}
            <FilterDropdown
              label={filters.distance !== 50 ? `≤${filters.distance}km` : "Distance"}
              icon={<MapPin className="w-3.5 h-3.5" />}
              active={filters.distance !== 50}
            >
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Distance</p>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Within</span>
                <span className="text-sm font-bold text-indigo-700">{filters.distance} km</span>
              </div>
              <input
                type="range" min={1} max={200} step={1}
                value={filters.distance}
                onChange={(e) => handleFilterChange("distance", Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-gray-300 mt-0.5">
                <span>1 km</span><span>200 km</span>
              </div>
            </FilterDropdown>

            {/* Rating */}
            <FilterDropdown
              label={filters.minRating > 0 ? `${filters.minRating}★+` : "Rating"}
              icon={<Star className="w-3.5 h-3.5" />}
              active={filters.minRating > 0}
            >
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Min. Rating</p>
              <div className="flex gap-1.5">
                {[0, 3, 3.5, 4, 4.5].map((r) => (
                  <Pill key={r} active={filters.minRating === r} onClick={() => handleFilterChange("minRating", r)}>
                    {r === 0 ? "Any" : `${r}★`}
                  </Pill>
                ))}
              </div>
            </FilterDropdown>

            {/* Sort */}
            <FilterDropdown
              label={filters.sort === "relevance" ? "Sort" : filters.sort.replace("-", " ")}
              icon={<SlidersHorizontal className="w-3.5 h-3.5" />}
              active={filters.sort !== "relevance"}
            >
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Sort by</p>
              <div className="flex flex-wrap gap-1.5">
                {([
                  { id: "relevance", label: "Relevance" },
                  { id: "date-asc", label: "Date ↑" },
                  { id: "date-desc", label: "Date ↓" },
                  { id: "price-asc", label: "Price ↑" },
                  { id: "price-desc", label: "Price ↓" },
                  { id: "popular", label: "Popular" },
                ] as { id: SortOption; label: string }[]).map((s) => (
                  <Pill key={s.id} active={filters.sort === s.id} onClick={() => handleFilterChange("sort", s.id)}>
                    {s.label}
                  </Pill>
                ))}
              </div>
            </FilterDropdown>

            {/* Reset — only shown when filters active */}
            {activeFilterCount > 0 && (
              <button
                onClick={() => { resetFilters(); if (submitted) setTimeout(handleSearch, 0); }}
                className="flex items-center gap-1 h-9 px-3 rounded-full border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            )}
          </div>

          {/* Active filter chips row */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {filters.category !== "all" && (
                <ActiveChip label={CATEGORIES.find(c => c.id === filters.category)?.label ?? filters.category} onRemove={() => handleFilterChange("category", "all")} />
              )}
              {filters.date !== "any" && (
                <ActiveChip
                  label={filters.date === "custom" ? `${filters.dateFrom}→${filters.dateTo}` : filters.date}
                  onRemove={() => { handleFilterChange("date", "any"); setFilter("dateFrom", ""); setFilter("dateTo", ""); }}
                />
              )}
              {filters.price !== "any" && (
                <ActiveChip label={filters.price} onRemove={() => handleFilterChange("price", "any")} />
              )}
              {filters.format !== "any" && (
                <ActiveChip label={filters.format} onRemove={() => handleFilterChange("format", "any")} />
              )}
              {filters.distance !== 50 && (
                <ActiveChip label={`≤${filters.distance}km`} onRemove={() => handleFilterChange("distance", 50)} />
              )}
              {filters.minRating > 0 && (
                <ActiveChip label={`${filters.minRating}★+`} onRemove={() => handleFilterChange("minRating", 0)} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Results ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* Before first search */}
        {!submitted && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
              <Search className="w-7 h-7 text-indigo-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-700 mb-1" style={{ fontFamily: "'Sora', sans-serif" }}>
              What are you looking for?
            </h2>
            <p className="text-sm text-gray-400 max-w-xs">
              Type something and hit the search button, or pick a filter above to explore events in {cityName}.
            </p>
          </div>
        )}

        {/* Loading */}
        {submitted && isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
                <div className="h-40 bg-gray-100" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No results */}
        {submitted && !isLoading && events.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Search className="w-7 h-7 text-gray-300" />
            </div>
            <h2 className="text-lg font-bold text-gray-600 mb-1" style={{ fontFamily: "'Sora', sans-serif" }}>
              No events found
            </h2>
            <p className="text-sm text-gray-400 max-w-xs mb-4">
              Try different keywords or adjust your filters.
            </p>
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset filters
            </button>
          </div>
        )}

        {/* Results grid — wire up your event cards here */}
        {submitted && !isLoading && events.length > 0 && (
          <>
            <p className="text-sm text-gray-400 mb-4">
              <span className="font-semibold text-gray-700">{events.length}</span> event{events.length !== 1 ? "s" : ""} found
              {filters.query && <> for <span className="font-semibold text-gray-700">"{filters.query}"</span></>}
              {" "}in <span className="font-medium text-gray-600">{cityName}</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Replace with your <EventCard event={e} /> */}
              {events.map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  Event card {i + 1}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
