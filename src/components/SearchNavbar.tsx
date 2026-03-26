"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, Search, X, ChevronDown,
  MapPin, Calendar, Tag, RotateCcw,
} from "lucide-react";
import { CATEGORIES } from "@/lib/events-data";
import { useCity } from "@/contexts/CityContext";

type DateFilter = "any" | "today" | "tomorrow" | "weekend" | "week";
type SortOption = "relevance" | "date-asc" | "date-desc" | "popular";

interface Filters {
  query: string;
  category: string;
  date: DateFilter;
  sort: SortOption;
}

const DEFAULT_FILTERS: Filters = {
  query: "",
  category: "all",
  date: "any",
  sort: "relevance",
};

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-100 whitespace-nowrap ${
        active
          ? "bg-indigo-600 border-indigo-600 text-white"
          : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-700"
      }`}
    >
      {children}
    </button>
  );
}

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
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 h-9 px-3.5 rounded-full border text-sm font-medium transition-all duration-100 whitespace-nowrap ${
          active
            ? "bg-indigo-600 border-indigo-600 text-white"
            : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50/40"
        }`}
      >
        {icon}
        <span>{label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute top-full mt-2 left-0 z-[100] bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 min-w-[260px]"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
          <button
            onClick={() => setOpen(false)}
            className="mt-4 w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}

export default function SearchNavbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { citySlug, cityName } = useCity();
  const shouldFocus = searchParams.get("focus") === "1";
  const inputRef = useRef<HTMLInputElement>(null);

  const [filters, setFilters] = useState<Filters>({
    query: searchParams.get("search") ?? "",
    category: searchParams.get("category") ?? "all",
    date: (searchParams.get("date") as DateFilter) ?? "any",
    sort: (searchParams.get("sort") as SortOption) ?? "relevance",
  });

  useEffect(() => {
    if (shouldFocus) setTimeout(() => inputRef.current?.focus(), 80);
  }, [shouldFocus]);

  const activeFilterCount = useMemo(
    () => [filters.category !== "all", filters.date !== "any"].filter(Boolean).length,
    [filters]
  );

  const pushFilters = (next: Filters) => {
    const params = new URLSearchParams();
    if (next.query.trim()) params.set("search", next.query.trim());
    if (next.category !== "all") params.set("category", next.category);
    if (next.date !== "any") params.set("date", next.date);
    if (next.sort !== "relevance") params.set("sort", next.sort);
    router.replace(`/${citySlug}/search?${params.toString()}`);
  };

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    const next = { ...filters, [key]: value } as Filters;
    setFilters(next);
    // category and date push immediately; query only on submit
    if (key !== "query") pushFilters(next);
  };

  const handleSearch = () => pushFilters(filters);

  const resetFilters = () => {
    const next = { ...DEFAULT_FILTERS, query: filters.query };
    setFilters(next);
    pushFilters(next);
  };

  const dateLabels: Record<string, string> = {
    any: "Date",
    today: "Today",
    tomorrow: "Tomorrow",
    weekend: "Weekend",
    week: "This week",
  };

  return (
    <header className="sticky top-0 z-[60] bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        <div className="flex items-center h-14 gap-2">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-indigo-50 transition-all shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 flex items-center h-10 px-3 rounded-full border border-gray-200 bg-gray-50/80 focus-within:border-indigo-400 focus-within:bg-white focus-within:shadow-sm transition-all duration-200">
            <Search className="w-4 h-4 text-gray-400 shrink-0 mr-2" />
            <input
              ref={inputRef}
              type="text"
              placeholder={`Search in ${cityName}…`}
              value={filters.query}
              onChange={(e) => setFilter("query", e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
              className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-400 min-w-0"
            />
            {filters.query && (
              <button
                onClick={() => setFilter("query", "")}
                className="ml-1 p-0.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors shrink-0"
                tabIndex={-1}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={handleSearch}
            className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white flex items-center justify-center shrink-0 shadow-sm transition-all"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={() => router.push(`/${citySlug}`)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-sm font-medium text-gray-600 shrink-0"
          >
            <MapPin className="w-3.5 h-3.5 text-indigo-500" />
            <span className="max-w-[80px] truncate">{cityName}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-3 pt-0.5">
          <FilterDropdown
            label={filters.category === "all" ? "Category" : (CATEGORIES.find((c) => c.id === filters.category)?.label ?? filters.category)}
            icon={<Tag className="w-3.5 h-3.5" />}
            active={filters.category !== "all"}
          >
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Category</p>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
              <Pill active={filters.category === "all"} onClick={() => setFilter("category", "all")}>All</Pill>
              {CATEGORIES.map((cat) => (
                <Pill key={cat.id} active={filters.category === cat.id} onClick={() => setFilter("category", cat.id)}>
                  {cat.icon} {cat.label}
                </Pill>
              ))}
            </div>
          </FilterDropdown>

          <FilterDropdown
            label={dateLabels[filters.date] ?? "Date"}
            icon={<Calendar className="w-3.5 h-3.5" />}
            active={filters.date !== "any"}
          >
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">When</p>
            <div className="flex flex-wrap gap-1.5">
              {(["any", "today", "tomorrow", "weekend", "week"] as DateFilter[]).map((d) => (
                <Pill key={d} active={filters.date === d} onClick={() => setFilter("date", d)}>
                  {dateLabels[d]}
                </Pill>
              ))}
            </div>
          </FilterDropdown>

          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 h-9 px-3 rounded-full border border-red-200 text-red-500 text-sm hover:bg-red-50 transition-colors shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
    }
