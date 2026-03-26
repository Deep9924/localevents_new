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

// ─── Compact inline option row ────────────────────────────────────────────────
function Option({
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
      className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
        active
          ? "bg-indigo-600 text-white font-medium"
          : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      <span>{children}</span>
      {active && (
        <svg className="w-3.5 h-3.5 shrink-0 ml-2" viewBox="0 0 12 12" fill="currentColor">
          <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      )}
    </button>
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
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        dropdownRef.current && !dropdownRef.current.contains(t) &&
        buttonRef.current && !buttonRef.current.contains(t)
      ) setOpen(false);
    };
    const id = setTimeout(() => document.addEventListener("mousedown", h), 0);
    return () => { clearTimeout(id); document.removeEventListener("mousedown", h); };
  }, [open]);

  const handleOpen = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropW = 200;
      const safeLeft = Math.min(
        rect.left + window.scrollX,
        window.innerWidth - dropW - 8
      );
      setCoords({ top: rect.bottom + window.scrollY + 6, left: safeLeft });
    }
    setOpen(v => !v);
  };

  return (
    <div className="relative shrink-0">
      <button
        ref={buttonRef}
        onClick={handleOpen}
        className={`flex items-center gap-1 h-8 px-3 rounded-full border text-xs font-medium transition-all duration-100 whitespace-nowrap ${
          active
            ? "bg-indigo-600 border-indigo-600 text-white"
            : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50/40"
        }`}
      >
        {icon}
        <span className="ml-0.5">{label}</span>
        <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && typeof window !== "undefined" && createPortal(
        <div
          ref={dropdownRef}
          style={{ position: "absolute", top: coords.top, left: coords.left, width: 200 }}
          className="z-[9999] bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 px-1"
          onClick={e => e.stopPropagation()}
        >
          {children}
        </div>,
        document.body
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
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

  // Autofocus
  useEffect(() => {
    if (searchParams.get("focus") === "1") {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [searchParams]);

  // Core: push ALL current filter state into the URL so the page re-renders with filtered results
  const push = (
    q: string,
    cat: string,
    d: DateFilter,
    p: PriceFilter,
    s: SortOption,
  ) => {
    const params = new URLSearchParams();
    if (q.trim())       params.set("search",   q.trim());
    if (cat !== "all")  params.set("category", cat);
    if (d !== "any")    params.set("date",     d);
    if (p !== "any")    params.set("price",    p);
    if (s !== "relevance") params.set("sort",  s);
    router.replace(`/${citySlug}/search?${params.toString()}`, { scroll: false });
  };

  // Each setter immediately pushes so the search page re-reads params
  const handleSearch        = ()                    => push(localQuery, category, date, price, sort);
  const handleCategoryChange = (val: string)        => { setCategory(val); push(localQuery, val, date, price, sort); };
  const handleDateChange     = (val: DateFilter)    => { setDate(val);     push(localQuery, category, val, price, sort); };
  const handlePriceChange    = (val: PriceFilter)   => { setPrice(val);    push(localQuery, category, date, val, sort); };
  const handleSortChange     = (val: SortOption)    => { setSort(val);     push(localQuery, category, date, price, val); };
  const handleReset          = ()                   => { setCategory("all"); setDate("any"); setPrice("any"); setSort("relevance"); push(localQuery, "all", "any", "any", "relevance"); };

  const dateLabels: Record<DateFilter, string> = {
    any: "Date", today: "Today", tomorrow: "Tomorrow", weekend: "This weekend", week: "This week",
  };
  const priceLabels: Record<PriceFilter, string> = {
    any: "Price", free: "Free", under20: "Under $20", "20to50": "$20–$50", "50plus": "$50+",
  };
  const sortLabels: Record<SortOption, string> = {
    relevance: "Sort by", "date-asc": "Date ↑ earliest", "date-desc": "Date ↓ latest",
    "price-asc": "Price ↑ low–high", "price-desc": "Price ↓ high–low",
  };

  const activeChips: { label: string; clear: () => void }[] = [
    ...(category !== "all"    ? [{ label: CATEGORIES.find(c => c.id === category)?.label ?? category, clear: () => handleCategoryChange("all") }] : []),
    ...(date !== "any"        ? [{ label: dateLabels[date],   clear: () => handleDateChange("any") }] : []),
    ...(price !== "any"       ? [{ label: priceLabels[price], clear: () => handlePriceChange("any") }] : []),
    ...(sort !== "relevance"  ? [{ label: sortLabels[sort],   clear: () => handleSortChange("relevance") }] : []),
  ];

  const hasActive = activeChips.length > 0;

  return (
    <header className="sticky top-0 z-[60] bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* ── Search row ── */}
        <div className="flex items-center h-14 gap-2">
          <button onClick={() => router.back()} className="p-2 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-indigo-50 transition-all shrink-0">
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
              <button onClick={() => { setLocalQuery(""); push("", category, date, price, sort); }} className="ml-1 p-0.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors shrink-0" tabIndex={-1}>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button onClick={handleSearch} className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white flex items-center justify-center shrink-0 shadow-sm transition-all">
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* ── Filter row — Sort first, then Category/Date/Price, then Reset ── */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-3">

          {/* Sort — first */}
          <FilterDropdown
            label={sort === "relevance" ? "Sort by" : sortLabels[sort].split(" ").slice(0, 2).join(" ")}
            icon={<ArrowUpDown className="w-3 h-3" />}
            active={sort !== "relevance"}
          >
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2.5 pt-1 pb-1.5">Sort by</p>
            <Option active={sort === "relevance"}   onClick={() => handleSortChange("relevance")}>Relevance</Option>
            <Option active={sort === "date-asc"}    onClick={() => handleSortChange("date-asc")}>Date — earliest first</Option>
            <Option active={sort === "date-desc"}   onClick={() => handleSortChange("date-desc")}>Date — latest first</Option>
            <Option active={sort === "price-asc"}   onClick={() => handleSortChange("price-asc")}>Price — low to high</Option>
            <Option active={sort === "price-desc"}  onClick={() => handleSortChange("price-desc")}>Price — high to low</Option>
          </FilterDropdown>

          {/* Thin divider */}
          <div className="w-px h-5 bg-gray-200 shrink-0" />

          {/* Category */}
          <FilterDropdown
            label={category === "all" ? "Category" : CATEGORIES.find(c => c.id === category)?.label ?? "Category"}
            icon={<Tag className="w-3 h-3" />}
            active={category !== "all"}
          >
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2.5 pt-1 pb-1.5">Category</p>
            <Option active={category === "all"} onClick={() => handleCategoryChange("all")}>All categories</Option>
            {CATEGORIES.filter(c => c.id !== "all").map(cat => (
              <Option key={cat.id} active={category === cat.id} onClick={() => handleCategoryChange(cat.id)}>
                {cat.icon} {cat.label}
              </Option>
            ))}
          </FilterDropdown>

          {/* Date */}
          <FilterDropdown
            label={dateLabels[date]}
            icon={<Calendar className="w-3 h-3" />}
            active={date !== "any"}
          >
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2.5 pt-1 pb-1.5">When</p>
            {(["any", "today", "tomorrow", "weekend", "week"] as DateFilter[]).map(d => (
              <Option key={d} active={date === d} onClick={() => handleDateChange(d)}>{dateLabels[d]}</Option>
            ))}
          </FilterDropdown>

          {/* Price */}
          <FilterDropdown
            label={priceLabels[price]}
            icon={<DollarSign className="w-3 h-3" />}
            active={price !== "any"}
          >
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2.5 pt-1 pb-1.5">Price</p>
            {(["any", "free", "under20", "20to50", "50plus"] as PriceFilter[]).map(p => (
              <Option key={p} active={price === p} onClick={() => handlePriceChange(p)}>{priceLabels[p]}</Option>
            ))}
          </FilterDropdown>

          {/* Reset */}
          {hasActive && (
            <button onClick={handleReset} className="flex items-center gap-1 h-8 px-2.5 rounded-full border border-red-200 text-red-400 text-xs hover:bg-red-50 transition-colors shrink-0">
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* ── Active chips ── */}
        {hasActive && (
          <div className="flex items-center gap-1.5 pb-2.5 overflow-x-auto scrollbar-hide">
            {activeChips.map((chip, i) => (
              <div key={i} className="flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium rounded-full shrink-0">
                <span>{chip.label}</span>
                <button onClick={chip.clear} className="p-0.5 hover:bg-indigo-200 rounded-full transition-colors">
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </header>
  );
}
