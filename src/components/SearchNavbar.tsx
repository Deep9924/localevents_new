"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, Search, X, ChevronDown,
  MapPin, Calendar, Tag, RotateCcw,
} from "lucide-react";
import { CATEGORIES } from "@/lib/events-data";
import { useCity } from "@/contexts/CityContext";

type DateFilter = "any" | "today" | "tomorrow" | "weekend" | "week";

interface Filters {
  query: string;
  category: string;
  date: DateFilter;
}

const DEFAULT_FILTERS: Filters = {
  query: "",
  category: "all",
  date: "any",
};

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 whitespace-nowrap ${
        active
          ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
          : "bg-white/80 border-gray-200 text-gray-700 hover:border-indigo-300 hover:text-indigo-700 hover:shadow-sm"
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
  onSelect,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  children: React.ReactNode;
  onSelect: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(() => {
    setOpen((v) => !v);
    // Apply immediately on open
    onSelect();
  }, [onSelect]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleClick}
        className={`flex items-center gap-1.5 h-10 px-4 rounded-full border text-sm font-medium transition-all duration-200 whitespace-nowrap shadow-sm ${
          active
            ? "bg-indigo-600 border-indigo-600 text-white shadow-md"
            : "bg-white/80 border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50/50 hover:shadow-md backdrop-blur-sm"
        }`}
      >
        {icon}
        <span className="font-medium">{label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 z-[100] bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-2xl p-4 min-w-[280px] animate-in slide-in-from-top-2 duration-200">
          <div className="max-h-60 overflow-y-auto">{children}</div>
        </div>
      )}
    </div>
  );
}

export default function SearchNavbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { citySlug, cityName } = useCity();
  const inputRef = useRef<HTMLInputElement>(null);

  const [filters, setFilters] = useState<Filters>({
    query: searchParams.get("search") ?? "",
    category: searchParams.get("category") ?? "all",
    date: (searchParams.get("date") as DateFilter) ?? "any",
  });

  // Sync with URL changes
  useEffect(() => {
    setFilters({
      query: searchParams.get("search") ?? "",
      category: searchParams.get("category") ?? "all",
      date: (searchParams.get("date") as DateFilter) ?? "any",
    });
  }, [searchParams]);

  const pushFilters = (nextFilters: Filters) => {
    const params = new URLSearchParams();
    if (nextFilters.query.trim()) params.set("search", nextFilters.query.trim());
    if (nextFilters.category !== "all") params.set("category", nextFilters.category);
    if (nextFilters.date !== "any") params.set("date", nextFilters.date);
    router.replace(`/${citySlug}/search?${params.toString()}`, { scroll: false });
  };

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    const next = { ...filters, [key]: value } as Filters;
    setFilters(next);
    pushFilters(next);
  };

  const handleSearch = () => {
    pushFilters(filters);
  };

  const resetFilters = () => {
    const next = { ...DEFAULT_FILTERS, query: filters.query };
    setFilters(next);
    pushFilters(next);
  };

  const dateLabels: Record<DateFilter, string> = {
    any: "Any date",
    today: "Today",
    tomorrow: "Tomorrow", 
    weekend: "This weekend",
    week: "This week",
  };

  const activeFilters = [
    filters.category !== "all" && CATEGORIES.find(c => c.id === filters.category)?.label,
    filters.date !== "any" && dateLabels[filters.date],
  ].filter(Boolean);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100/50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Search Row */}
        <div className="flex items-center h-16 gap-3">
          <button
            onClick={() => router.back()}
            className="p-3 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-2xl transition-all duration-200 shrink-0 backdrop-blur-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 flex items-center h-12 px-4 rounded-2xl border-2 border-gray-200/60 bg-white/80 focus-within:border-indigo-400 focus-within:bg-white focus-within:shadow-xl transition-all duration-300 backdrop-blur-sm shadow-sm">
            <Search className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder={`Search events in ${cityName}…`}
              value={filters.query}
              onChange={(e) => setFilter("query", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 text-base bg-transparent outline-none text-gray-900 placeholder:text-gray-500 font-medium"
            />
            {filters.query && (
              <button
                onClick={() => setFilter("query", "")}
                className="p-1.5 ml-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 transition-all duration-200 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={handleSearch}
            className="w-12 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.97] shadow-lg hover:shadow-xl text-white flex items-center justify-center transition-all duration-200 flex-shrink-0"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>

        {/* Filters Row */}
        <div className="flex items-center gap-2.5 pb-4 overflow-x-auto scrollbar-hide -mb-1">
          
          <FilterDropdown
            label={filters.category === "all" ? "All categories" : CATEGORIES.find(c => c.id === filters.category)?.label ?? "Category"}
            icon={<Tag className="w-4 h-4" />}
            active={filters.category !== "all"}
            onSelect={() => {}}
          >
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5 pb-3 -m-1.5">
                <Pill active={filters.category === "all"} onClick={() => setFilter("category", "all")}>
                  All
                </Pill>
                {CATEGORIES.slice(1).map((cat) => (
                  <Pill 
                    key={cat.id} 
                    active={filters.category === cat.id} 
                    onClick={() => setFilter("category", cat.id)}
                  >
                    <span className="w-4 h-4 flex-shrink-0">{cat.icon}</span>
                    <span className="max-w-[120px] truncate">{cat.label}</span>
                  </Pill>
                ))}
              </div>
            </div>
          </FilterDropdown>

          <FilterDropdown
            label={dateLabels[filters.date] ?? "Any date"}
            icon={<Calendar className="w-4 h-4" />}
            active={filters.date !== "any"}
            onSelect={() => {}}
          >
            <div className="grid grid-cols-2 gap-2 p-1">
              {(["any", "today", "tomorrow", "weekend", "week"] as DateFilter[]).map((d) => (
                <Pill 
                  key={d} 
                  active={filters.date === d}
                  onClick={() => setFilter("date", d)}
                >
                  {dateLabels[d]}
                </Pill>
              ))}
            </div>
          </FilterDropdown>

          {activeFilters.length > 0 && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-2 h-10 px-4 rounded-2xl border-2 border-red-200/60 bg-red-50/50 text-red-600 hover:bg-red-100 hover:border-red-300 text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md flex-shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div className="flex items-center gap-2 pb-4 overflow-x-auto scrollbar-hide -mx-1 px-1">
            {activeFilters.map((filter, i) => (
              <div 
                key={i}
                className="px-3 py-1.5 bg-indigo-100/80 border border-indigo-200 text-indigo-800 text-xs font-medium rounded-full backdrop-blur-sm shadow-sm flex-shrink-0"
              >
                {filter}
                <button
                  onClick={() => {
                    // Reset this specific filter
                    if (i === 0) setFilter("category", "all");
                    if (i === 1) setFilter("date", "any");
                  }}
                  className="ml-1.5 -mr-1.5 p-0.5 hover:bg-indigo-200 rounded-full transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
    }
