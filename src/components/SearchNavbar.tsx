// src/components/SearchNavbar.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, Search, X, ChevronDown,
  Calendar, Tag, RotateCcw, DollarSign, ArrowUpDown,
} from "lucide-react";
import { CATEGORIES } from "@/lib/events-data";
import { useCity } from "@/contexts/CityContext";
import { createPortal } from "react-dom";

type DateFilter  = "any" | "today" | "tomorrow" | "weekend" | "week";
type PriceFilter = "any" | "free" | "under20" | "20to50" | "50plus";
type SortOption  = "relevance" | "date-asc" | "date-desc" | "price-asc" | "price-desc";

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
      className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-all duration-100 ${
        active
          ? "bg-indigo-600 text-white shadow-sm"
          : "bg-gray-50 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
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
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        dropdownRef.current && !dropdownRef.current.contains(t) &&
        buttonRef.current && !buttonRef.current.contains(t)
      ) setOpen(false);
    };
    // Small delay so the button click itself doesn't immediately close
    const id = setTimeout(() => document.addEventListener("mousedown", h), 0);
    return () => { clearTimeout(id); document.removeEventListener("mousedown", h); };
  }, [open]);

  const handleOpen = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // Clamp left so dropdown never overflows right edge of viewport
      const dropW = 220;
      const safeLeft = Math.min(
        rect.left + window.scrollX,
        window.innerWidth - dropW - 8
      );
      setCoords({
        top: rect.bottom + window.scrollY + 6,
        left: safeLeft,
        width: dropW,
      });
    }
    setOpen(v => !v);
  };

  return (
    <div className="relative shrink-0">
      <button
        ref={buttonRef}
        onClick={handleOpen}
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

      {open && typeof window !== "undefined" && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: "absolute",
            top: coords.top,
            left: coords.left,
            width: coords.width,
          }}
          className="z-[9999] bg-white border border-gray-200 rounded-2xl shadow-2xl p-3 flex flex-col gap-1"
          onClick={e => e.stopPropagation()}
        >
          {children}
        </div>,
        document.body
      )}
    </div>
  );
}

export default function SearchNavbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { citySlug, cityName } = useCity();
  const inputRef = useRef<HTMLInputElement>(null);

  const [localQuery, setLocalQuery] = useState(searchParams.get("search") ?? "");
  const [category, setCategory]     = useState(searchParams.get("category") ?? "all");
  const [date, setDate]             = useState<DateFilter>((searchParams.get("date") as DateFilter) ?? "any");
  const [price, setPrice]           = useState<PriceFilter>((searchParams.get("price") as PriceFilter) ?? "any");
  const [sort, setSort]             = useState<SortOption>((searchParams.get("sort") as SortOption) ?? "relevance");

  // Auto-focus when ?focus=1
  useEffect(() => {
    if (searchParams.get("focus") === "1") {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [searchParams]);

  const pushFilters = (
    q: string,
    cat: string,
    d: DateFilter,
    p: PriceFilter,
    s: SortOption,
  ) => {
    const params = new URLSearchParams();
    if (q.trim())    params.set("search", q.trim());
    if (cat !== "all") params.set("category", cat);
    if (d !== "any") params.set("date", d);
    if (p !== "any") params.set("price", p);
    if (s !== "relevance") params.set("sort", s);
    router.replace(`/${citySlug}/search?${params.toString()}`, { scroll: false });
  };

  const handleSearch = () => pushFilters(localQuery, category, date, price, sort);

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    pushFilters(localQuery, val, date, price, sort);
  };

  const handleDateChange = (val: DateFilter) => {
    setDate(val);
    pushFilters(localQuery, category, val, price, sort);
  };

  const handlePriceChange = (val: PriceFilter) => {
    setPrice(val);
    pushFilters(localQuery, category, date, val, sort);
  };

  const handleSortChange = (val: SortOption) => {
    setSort(val);
    pushFilters(localQuery, category, date, price, val);
  };

  const handleReset = () => {
    setCategory("all"); setDate("any"); setPrice("any"); setSort("relevance");
    pushFilters(localQuery, "all", "any", "any", "relevance");
  };

  const dateLabels: Record<DateFilter, string> = {
    any: "Date", today: "Today", tomorrow: "Tomorrow",
    weekend: "This weekend", week: "This week",
  };

  const priceLabels: Record<PriceFilter, string> = {
    any: "Price", free: "Free", under20: "Under $20",
    "20to50": "$20 – $50", "50plus": "$50+",
  };

  const sortLabels: Record<SortOption, string> = {
    relevance: "Sort", "date-asc": "Earliest first", "date-desc": "Latest first",
    "price-asc": "Price: low–high", "price-desc": "Price: high–low",
  };

  const activeFilterCount = [
    category !== "all",
    date !== "any",
    price !== "any",
    sort !== "relevance",
  ].filter(Boolean).length;

  const activeChips: { label: string; clear: () => void }[] = [
    ...(category !== "all" ? [{ label: CATEGORIES.find(c => c.id === category)?.label ?? category, clear: () => { setCategory("all"); pushFilters(localQuery, "all", date, price, sort); } }] : []),
    ...(date !== "any"     ? [{ label: dateLabels[date],   clear: () => { setDate("any");  pushFilters(localQuery, category, "any", price, sort); } }] : []),
    ...(price !== "any"    ? [{ label: priceLabels[price], clear: () => { setPrice("any"); pushFilters(localQuery, category, date, "any", sort);  } }] : []),
    ...(sort !== "relevance" ? [{ label: sortLabels[sort],  clear: () => { setSort("relevance"); pushFilters(localQuery, category, date, price, "relevance"); } }] : []),
  ];

  return (
    <header className="sticky top-0 z-[60] bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* ── Search row ── */}
        <div className="flex items-center h-14 gap-2">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-indigo-50 transition-all shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 flex items-center h-10 px-3 rounded-full border border-gray-200 bg-gray-50 focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all duration-200">
            <input
              ref={inputRef}
              type="text"
              placeholder={`Search in ${cityName}…`}
              value={localQuery}
              onChange={e => setLocalQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-400 min-w-0"
            />
            {localQuery && (
              <button
                onClick={() => { setLocalQuery(""); pushFilters("", category, date, price, sort); }}
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
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* ── Filter row ── */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-3">

          {/* Category */}
          <FilterDropdown
            label={category === "all" ? "Category" : CATEGORIES.find(c => c.id === category)?.label ?? "Category"}
            icon={<Tag className="w-3.5 h-3.5" />}
            active={category !== "all"}
          >
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 pb-1">Category</p>
            <Pill active={category === "all"} onClick={() => handleCategoryChange("all")}>All categories</Pill>
            {CATEGORIES.filter(c => c.id !== "all").map(cat => (
              <Pill key={cat.id} active={category === cat.id} onClick={() => handleCategoryChange(cat.id)}>
                {cat.icon} {cat.label}
              </Pill>
            ))}
          </FilterDropdown>

          {/* Date */}
          <FilterDropdown
            label={dateLabels[date]}
            icon={<Calendar className="w-3.5 h-3.5" />}
            active={date !== "any"}
          >
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 pb-1">When</p>
            {(["any", "today", "tomorrow", "weekend", "week"] as DateFilter[]).map(d => (
              <Pill key={d} active={date === d} onClick={() => handleDateChange(d)}>
                {dateLabels[d]}
              </Pill>
            ))}
          </FilterDropdown>

          {/* Price */}
          <FilterDropdown
            label={priceLabels[price]}
            icon={<DollarSign className="w-3.5 h-3.5" />}
            active={price !== "any"}
          >
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 pb-1">Price</p>
            {(["any", "free", "under20", "20to50", "50plus"] as PriceFilter[]).map(p => (
              <Pill key={p} active={price === p} onClick={() => handlePriceChange(p)}>
                {priceLabels[p]}
              </Pill>
            ))}
          </FilterDropdown>

          {/* Sort */}
          <FilterDropdown
            label={sort === "relevance" ? "Sort" : sortLabels[sort]}
            icon={<ArrowUpDown className="w-3.5 h-3.5" />}
            active={sort !== "relevance"}
          >
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 pb-1">Sort by</p>
            {(["relevance", "date-asc", "date-desc", "price-asc", "price-desc"] as SortOption[]).map(s => (
              <Pill key={s} active={sort === s} onClick={() => handleSortChange(s)}>
                {sortLabels[s]}
              </Pill>
            ))}
          </FilterDropdown>

          {/* Reset */}
          {activeFilterCount > 0 && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 h-9 px-3 rounded-full border border-red-200 text-red-500 text-sm hover:bg-red-50 transition-colors shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>

        {/* ── Active filter chips ── */}
        {activeChips.length > 0 && (
          <div className="flex items-center gap-2 pb-3 overflow-x-auto scrollbar-hide">
            {activeChips.map((chip, i) => (
              <div key={i} className="flex items-center gap-1 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium rounded-full shrink-0">
                <span>{chip.label}</span>
                <button onClick={chip.clear} className="ml-0.5 p-0.5 hover:bg-indigo-200 rounded-full transition-colors">
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
