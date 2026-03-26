"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Search,
  X,
  ChevronDown,
  MapPin,
  Calendar,
  Tag,
  DollarSign,
  Users,
  Clock,
  RotateCcw,
} from "lucide-react";
import { CATEGORIES } from "@/lib/events-data";
import { useCity } from "@/contexts/CityContext";

type DateFilter = "any" | "today" | "tomorrow" | "weekend" | "week" | "month";
type PriceFilter = "any" | "free" | "under10" | "under25" | "under50" | "paid";
type FormatFilter = "any" | "in-person" | "online" | "hybrid";
type SortOption = "relevance" | "date-asc" | "date-desc" | "price-asc" | "price-desc" | "popular";

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

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-100 whitespace-nowrap shrink-0 ${
        active
          ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
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
        className={`flex items-center gap-1.5 h-9 px-3.5 rounded-full border text-sm font-medium transition-all duration-100 ${
          active
            ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
            : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50/40"
        }`}
      >
        {icon}
        <span>{label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 min-w-[240px]">
          {children}
          <button
            onClick={() => setOpen(false)}
            className="mt-3 w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
          >
            Done
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
    price: (searchParams.get("price") as PriceFilter) ?? "any",
    format: (searchParams.get("format") as FormatFilter) ?? "any",
    sort: (searchParams.get("sort") as SortOption) ?? "relevance",
  });

  useEffect(() => {
    if (shouldFocus) setTimeout(() => inputRef.current?.focus(), 80);
  }, [shouldFocus]);

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    const next = { ...filters, [key]: value } as Filters;
    setFilters(next);

    const params = new URLSearchParams();
    if (next.query.trim()) params.set("search", next.query.trim());
    if (next.category !== "all") params.set("category", next.category);
    if (next.date !== "any") params.set("date", next.date);
    if (next.price !== "any") params.set("price", next.price);
    if (next.format !== "any") params.set("format", next.format);
    if (next.sort !== "relevance") params.set("sort", next.sort);

    router.replace(`/${citySlug}/search?${params.toString()}`);
  };

  const activeFilterCount = useMemo(
    () =>
      [
        filters.category !== "all",
        filters.date !== "any",
        filters.price !== "any",
        filters.format !== "any",
      ].filter(Boolean).length,
    [filters]
  );

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (filters.query.trim()) params.set("search", filters.query.trim());
    if (filters.category !== "all") params.set("category", filters.category);
    if (filters.date !== "any") params.set("date", filters.date);
    if (filters.price !== "any") params.set("price", filters.price);
    if (filters.format !== "any") params.set("format", filters.format);
    if (filters.sort !== "relevance") params.set("sort", filters.sort);
    router.replace(`/${citySlug}/search?${params.toString()}`);
  };

  const resetFilters = () => {
    const next = { ...DEFAULT_FILTERS, query: filters.query };
    setFilters(next);
    router.replace(
      filters.query.trim()
        ? `/${citySlug}/search?search=${encodeURIComponent(filters.query.trim())}`
        : `/${citySlug}/search`
    );
  };

  return (
    <header className="sticky top-0 z-[60] bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center h-14 gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-1 text-gray-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all duration-100 shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 flex items-center h-10 px-4 rounded-full border border-gray-200 bg-gray-50 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:bg-white transition-all duration-200">
            <input
              ref={inputRef}
              type="text"
              placeholder={`Search events in ${cityName}…`}
              value={filters.query}
              onChange={(e) => setFilter("query", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
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
            className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white transition-all duration-100 shrink-0 shadow-sm"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={() => router.push(`/${citySlug}`)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-sm font-medium text-gray-600 shrink-0"
          >
            <MapPin className="w-3.5 h-3.5 text-indigo-500" />
            <span>{cityName}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-3">
          <FilterDropdown
            label={
              filters.category === "all"
                ? "Category"
                : CATEGORIES.find((c) => c.id === filters.category)?.label ??
                  filters.category
            }
            icon={<Tag className="w-3.5 h-3.5" />}
            active={filters.category !== "all"}
          >
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Category
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Pill
                active={filters.category === "all"}
                onClick={() => setFilter("category", "all")}
              >
                All
              </Pill>
              {CATEGORIES.map((cat) => (
                <Pill
                  key={cat.id}
                  active={filters.category === cat.id}
                  onClick={() => setFilter("category", cat.id)}
                >
                  {cat.icon} {cat.label}
                </Pill>
              ))}
            </div>
          </FilterDropdown>

          <FilterDropdown
            label={
              filters.date === "any"
                ? "Date"
                : ({
                    today: "Today",
                    tomorrow: "Tomorrow",
                    weekend: "Weekend",
                    week: "This week",
                    month: "This month",
                  }[filters.date] ?? filters.date)
            }
            icon={<Calendar className="w-3.5 h-3.5" />}
            active={filters.date !== "any"}
          >
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              When
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "any", label: "Any time" },
                { id: "today", label: "Today" },
                { id: "tomorrow", label: "Tomorrow" },
                { id: "weekend", label: "Weekend" },
                { id: "week", label: "This week" },
                { id: "month", label: "This month" },
              ].map((d) => (
                <Pill
                  key={d.id}
                  active={filters.date === d.id}
                  onClick={() => setFilter("date", d.id as DateFilter)}
                >
                  {d.label}
                </Pill>
              ))}
            </div>
          </FilterDropdown>

          <FilterDropdown
            label={
              filters.price === "any"
                ? "Price"
                : ({
                    free: "Free",
                    under10: "< $10",
                    under25: "< $25",
                    under50: "< $50",
                    paid: "Paid",
                  }[filters.price] ?? filters.price)
            }
            icon={<DollarSign className="w-3.5 h-3.5" />}
            active={filters.price !== "any"}
          >
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Price
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "any", label: "Any" },
                { id: "free", label: "Free" },
                { id: "under10", label: "Under $10" },
                { id: "under25", label: "Under $25" },
                { id: "under50", label: "Under $50" },
                { id: "paid", label: "Paid" },
              ].map((p) => (
                <Pill
                  key={p.id}
                  active={filters.price === p.id}
                  onClick={() => setFilter("price", p.id as PriceFilter)}
                >
                  {p.label}
                </Pill>
              ))}
            </div>
          </FilterDropdown>

          <FilterDropdown
            label={
              filters.format === "any"
                ? "Format"
                : ({
                    "in-person": "In-person",
                    online: "Online",
                    hybrid: "Hybrid",
                  }[filters.format] ?? filters.format)
            }
            icon={<Users className="w-3.5 h-3.5" />}
            active={filters.format !== "any"}
          >
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Format
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "any", label: "Any" },
                { id: "in-person", label: "In-person" },
                { id: "online", label: "Online" },
                { id: "hybrid", label: "Hybrid" },
              ].map((f) => (
                <Pill
                  key={f.id}
                  active={filters.format === f.id}
                  onClick={() => setFilter("format", f.id as FormatFilter)}
                >
                  {f.label}
                </Pill>
              ))}
            </div>
          </FilterDropdown>

          <FilterDropdown
            label={
              ({
                relevance: "Relevance",
                "date-asc": "Earliest",
                "date-desc": "Latest",
                "price-asc": "Cheapest",
                "price-desc": "Priciest",
                popular: "Popular",
              }[filters.sort] ?? "Sort")
            }
            icon={<Clock className="w-3.5 h-3.5" />}
            active={filters.sort !== "relevance"}
          >
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Sort by
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "relevance", label: "Relevance" },
                { id: "date-asc", label: "Date ↑" },
                { id: "date-desc", label: "Date ↓" },
                { id: "price-asc", label: "Price ↑" },
                { id: "price-desc", label: "Price ↓" },
                { id: "popular", label: "Popular" },
              ].map((s) => (
                <Pill
                  key={s.id}
                  active={filters.sort === s.id}
                  onClick={() => setFilter("sort", s.id as SortOption)}
                >
                  {s.label}
                </Pill>
              ))}
            </div>
          </FilterDropdown>

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
  );
    }
