"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, Search, X, ChevronDown,
  Calendar, Tag, RotateCcw, DollarSign,
} from "lucide-react";
import { CATEGORIES } from "@/lib/events-data";
import { useCity } from "@/contexts/CityContext";
import { createPortal } from "react-dom";

type DateFilter = "any" | "today" | "tomorrow" | "weekend" | "week";
type PriceFilter = "any" | "free" | "under20" | "20to50" | "50plus";

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
      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-100 whitespace-nowrap ${
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
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (
        ref.current && !ref.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleOpen = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
      });
    }
    setOpen((v) => !v);
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
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={ref}
          style={{ position: "absolute", top: coords.top, left: coords.left }}
          className="z-[9999] bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 min-w-[280px]"
          onClick={(e) => e.stopPropagation()}
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
  const [category, setCategory] = useState(searchParams.get("category") ?? "all");
  const [date, setDate] = useState<DateFilter>(
    (searchParams.get("date") as DateFilter) ?? "any"
  );
  const [price, setPrice] = useState<PriceFilter>(
    (searchParams.get("price") as PriceFilter) ?? "any"
  );

  const pushFilters = (q: string, cat: string, d: DateFilter, p: PriceFilter) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("search", q.trim());
    if (cat !== "all") params.set("category", cat);
    if (d !== "any") params.set("date", d);
    if (p !== "any") params.set("price", p);
    router.replace(`/${citySlug}/search?${params.toString()}`, { scroll: false });
  };

  const handleSearch = () => pushFilters(localQuery, category, date, price);

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    pushFilters(localQuery, val, date, price);
  };

  const handleDateChange = (val: DateFilter) => {
    setDate(val);
    pushFilters(localQuery, category, val, price);
  };

  const handlePriceChange = (val: PriceFilter) => {
    setPrice(val);
    pushFilters(localQuery, category, date, val);
  };

  const handleReset = () => {
    setCategory("all");
    setDate("any");
    setPrice("any");
    pushFilters(localQuery, "all", "any", "any");
  };

  const dateLabels: Record<DateFilter, string> = {
    any: "Date",
    today: "Today",
    tomorrow: "Tomorrow",
    weekend: "This weekend",
    week: "This week",
  };

  const priceLabels: Record<PriceFilter, string> = {
    any: "Price",
    free: "Free",
    under20: "Under $20",
    "20to50": "$20 – $50",
    "50plus": "$50+",
  };

  const activeFilters = [
    category !== "all" && CATEGORIES.find((c) => c.id === category)?.label,
    date !== "any" && dateLabels[date],
    price !== "any" && priceLabels[price],
  ].filter(Boolean) as string[];

  const handleRemoveFilter = (i: number) => {
    if (i === 0) { setCategory("all"); pushFilters(localQuery, "all", date, price); }
    if (i === 1) { setDate("any"); pushFilters(localQuery, category, "any", price); }
    if (i === 2) { setPrice("any"); pushFilters(localQuery, category, date, "any"); }
  };

  return (
    <header className="sticky top-0 z-[60] bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Search row */}
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
              onChange={(e) => setLocalQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-400 min-w-0"
            />
            {localQuery && (
              <button
                onClick={() => {
                  setLocalQuery("");
                  pushFilters("", category, date, price);
                }}
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

        {/* Filter row */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-3">

          {/* Category */}
          <FilterDropdown
            label={category === "all" ? "Category" : CATEGORIES.find((c) => c.id === category)?.label ?? "Category"}
            icon={<Tag className="w-3.5 h-3.5" />}
            active={category !== "all"}
          >
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              Category
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-52 overflow-y-auto">
              <Pill active={category === "all"} onClick={() => handleCategoryChange("all")}>
                All
              </Pill>
              {CATEGORIES.slice(1).map((cat) => (
                <Pill
                  key={cat.id}
                  active={category === cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                >
                  {cat.icon} {cat.label}
                </Pill>
              ))}
            </div>
          </FilterDropdown>

          {/* Date */}
          <FilterDropdown
            label={dateLabels[date]}
            icon={<Calendar className="w-3.5 h-3.5" />}
            active={date !== "any"}
          >
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              When
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(["any", "today", "tomorrow", "weekend", "week"] as DateFilter[]).map((d) => (
                <Pill key={d} active={date === d} onClick={() => handleDateChange(d)}>
                  {dateLabels[d]}
                </Pill>
              ))}
            </div>
          </FilterDropdown>

          {/* Price */}
          <FilterDropdown
            label={priceLabels[price]}
            icon={<DollarSign className="w-3.5 h-3.5" />}
            active={price !== "any"}
          >
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              Price
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(["any", "free", "under20", "20to50", "50plus"] as PriceFilter[]).map((p) => (
                <Pill key={p} active={price === p} onClick={() => handlePriceChange(p)}>
                  {priceLabels[p]}
                </Pill>
              ))}
            </div>
          </FilterDropdown>

          {/* Reset */}
          {activeFilters.length > 0 && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 h-9 px-3 rounded-full border border-red-200 text-red-500 text-sm hover:bg-red-50 transition-colors shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div className="flex items-center gap-2 pb-3 overflow-x-auto scrollbar-hide">
            {activeFilters.map((filter, i) => (
              <div
                key={i}
                className="flex items-center gap-1 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium rounded-full shrink-0"
              >
                <span>{filter}</span>
                <button
                  onClick={() => handleRemoveFilter(i)}
                  className="ml-0.5 p-0.5 hover:bg-indigo-200 rounded-full transition-colors"
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
