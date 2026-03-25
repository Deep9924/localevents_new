// src/components/CityPickerModal.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Search, Navigation, LocateFixed } from "lucide-react";
import { CITIES } from "@/lib/events-data";
import { trpc } from "@/lib/trpc";

interface CityPickerModalProps {
  open: boolean;
  currentCitySlug: string;
  onSelect: (slug: string) => void;
  onClose: () => void;
  eventCounts?: Record<string, number>;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-indigo-600 font-bold">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function CityPickerModal({
  open,
  currentCitySlug,
  onSelect,
  onClose,
  eventCounts = {},
}: CityPickerModalProps) {
  const [query, setQuery] = useState("");
  const [nearbyCities, setNearbyCities] = useState<typeof CITIES>(CITIES.slice(0, 6));
  const [detecting, setDetecting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [activeCity, setActiveCity] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  const { data: countsData } = trpc.events.getCountByCity.useQuery(undefined, {
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (open) {
      setVisible(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimating(true)));
    } else {
      setAnimating(false);
      const t = setTimeout(() => setVisible(false), 280);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setShowSuggestions(false);
    setActiveCity(null);
    setTimeout(() => inputRef.current?.focus(), 60);
    detectNearby();
  }, [open]);

  useEffect(() => {
    if (open) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const detectNearby = async () => {
    setDetecting(true);
    try {
      const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(4000) });
      const data = await res.json();
      if (data.latitude && data.longitude) {
        const sorted = [...CITIES]
          .map((c) => ({ ...c, dist: haversine(data.latitude, data.longitude, c.lat, c.lng) }))
          .sort((a, b) => a.dist - b.dist)
          .slice(0, 6);
        setNearbyCities(sorted);
      }
    } catch {
      // keep defaults
    } finally {
      setDetecting(false);
    }
  };

  const handleLocateMe = async () => {
    setLocating(true);
    try {
      const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(4000) });
      const data = await res.json();
      if (data.latitude && data.longitude) {
        const closest = [...CITIES]
          .map((c) => ({ ...c, dist: haversine(data.latitude, data.longitude, c.lat, c.lng) }))
          .sort((a, b) => a.dist - b.dist)[0];
        if (closest) onSelect(closest.slug);
      }
    } catch {
      // silently fail
    } finally {
      setLocating(false);
    }
  };

  const getEventCount = (slug: string) => countsData?.[slug] ?? eventCounts[slug];

  if (!visible) return null;

  const isSearching = query.trim().length > 0;
  const q = query.toLowerCase().trim();

  const filtered = isSearching
    ? [
        ...CITIES.filter((c) => c.name.toLowerCase().startsWith(q)),
        ...CITIES.filter((c) => !c.name.toLowerCase().startsWith(q) && c.name.toLowerCase().includes(q)),
      ]
    : [];

  const nearbyGrid = nearbyCities.filter((c) => c.slug !== currentCitySlug).slice(0, 6);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && filtered.length > 0) {
      onSelect(filtered[0].slug);
      setShowSuggestions(false);
    }
    if (e.key === "Escape") {
      if (showSuggestions && isSearching) setShowSuggestions(false);
      else onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-6 sm:pt-14 px-3 sm:px-4">
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          animating ? "opacity-60" : "opacity-0"
        }`}
        onClick={onClose}
      />

      <div
        className={`relative w-[94%] sm:w-full max-w-lg sm:max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ease-out ${
          animating ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-6"
        }`}
      >
        <div
          className="px-5 sm:px-7 pt-6 sm:pt-8 pb-8 sm:pb-10"
          style={{
            background:
              "linear-gradient(180deg, #4338ca 0%, #818cf8 55%, #c7d2fe 75%, #eef2ff 88%, #ffffff 100%)",
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg sm:text-xl font-bold text-white" style={{ fontFamily: "'Sora', sans-serif" }}>
              LocalEvents in your city
            </h2>
            <button
              onClick={onClose}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <span className="text-white text-sm font-bold leading-none">✕</span>
            </button>
          </div>

          <div ref={searchWrapperRef} className="relative">
            <div className="relative flex items-center bg-white rounded-xl shadow-lg overflow-hidden">
              <Search className="absolute left-3.5 w-4 h-4 text-gray-400 pointer-events-none shrink-0 z-10" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
                placeholder="Enter your city..."
                className="flex-1 pl-10 pr-2 py-3 text-sm focus:outline-none text-gray-700 bg-transparent min-w-0"
              />
              <button
                onClick={handleLocateMe}
                disabled={locating}
                title="Use my current location"
                className="flex items-center justify-center gap-1.5 pl-2.5 pr-2.5 sm:pr-3.5 py-1.5 my-1.5 mr-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors shrink-0 min-w-[34px]"
              >
                {locating ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin block shrink-0" />
                    <span className="hidden sm:inline text-xs font-medium text-indigo-600 whitespace-nowrap">
                      Locating...
                    </span>
                  </>
                ) : (
                  <>
                    <LocateFixed className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="hidden sm:inline text-xs font-medium text-indigo-600 whitespace-nowrap">
                      Current Location
                    </span>
                  </>
                )}
              </button>
            </div>

            {isSearching && showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-10 max-h-56 overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="py-4 text-sm text-gray-400 text-center">No cities found</p>
                ) : (
                  filtered.map((city) => {
                    const isCurrent = city.slug === currentCitySlug;
                    const count = getEventCount(city.slug);
                    return (
                      <button
                        key={city.slug}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          onSelect(city.slug);
                          setShowSuggestions(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-gray-50 last:border-0 hover:bg-indigo-50 active:bg-indigo-100 group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-white group-hover:shadow-sm group-hover:border group-hover:border-gray-200 group-active:bg-white group-active:shadow-sm group-active:border group-active:border-gray-300 flex items-center justify-center shrink-0 transition-all">
                          <MapPin className="w-4 h-4 text-gray-400 group-hover:text-indigo-400 group-active:text-indigo-500 transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 h-5">
                            <p className="text-sm font-medium text-gray-800 leading-none">
                              <HighlightMatch text={city.name} query={query} />
                            </p>
                            {isCurrent && (
                              <span
                                className="text-[10px] font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 rounded-full"
                                style={{ paddingTop: "2px", paddingBottom: "2px", lineHeight: 1 }}
                              >
                                current
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">{city.province}</p>
                        </div>
                        {count !== undefined && <span className="text-xs text-gray-400 shrink-0">{count} events</span>}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        <div className="px-5 sm:px-7 pb-6 sm:pb-8 pt-0 bg-white">
          <div className="flex items-center justify-between mb-3 pt-4 sm:pt-5">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <Navigation className="w-3 h-3" /> Nearby Cities
            </p>
            {detecting && <span className="text-[10px] text-gray-400 animate-pulse">Detecting...</span>}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
            {nearbyGrid.map((city) => {
              const count = getEventCount(city.slug);
              const isCurrent = city.slug === currentCitySlug;
              const isActive = activeCity === city.slug;

              return (
                <button
                  key={city.slug}
                  onClick={() => onSelect(city.slug)}
                  onTouchStart={() => setActiveCity(city.slug)}
                  onTouchEnd={() => setActiveCity(null)}
                  onTouchCancel={() => setActiveCity(null)}
                  className={`flex items-center gap-2.5 px-3 py-3 rounded-xl text-left transition-all group ${
                    isCurrent
                      ? "bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-100"
                      : isActive
                      ? "bg-indigo-100"
                      : "hover:bg-indigo-50 active:bg-indigo-100"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                      isCurrent
                        ? "bg-indigo-100 group-hover:bg-indigo-200"
                        : isActive
                        ? "bg-white shadow-sm border border-gray-300"
                        : "bg-gray-100 group-hover:bg-white group-hover:shadow-sm group-hover:border group-hover:border-gray-200 group-active:bg-white group-active:shadow-sm group-active:border group-active:border-gray-300"
                    }`}
                  >
                    <MapPin
                      className={`w-4 h-4 transition-colors ${
                        isCurrent
                          ? "text-indigo-500"
                          : isActive
                          ? "text-indigo-500"
                          : "text-gray-400 group-hover:text-indigo-400 group-active:text-indigo-500"
                      }`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <p className={`text-sm font-medium leading-tight ${isCurrent ? "text-indigo-700" : "text-gray-800"}`}>
                        {city.name}
                      </p>
                      {isCurrent && <span className="text-[9px] text-indigo-400 shrink-0">●</span>}
                    </div>
                    <p className={`text-xs mt-0.5 ${isCurrent ? "text-indigo-400" : "text-gray-400"}`}>
                      {count !== undefined ? `${count} events` : city.province}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
