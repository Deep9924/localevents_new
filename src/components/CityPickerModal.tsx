// src/components/CityPickerModal.tsx
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { MapPin, Search, LocateFixed, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { calculateDistance, getIPGeolocation } from "@/lib/utils";
import type { AppRouter } from "@/server/routers";
import type { inferRouterOutputs } from "@trpc/server";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type City = RouterOutputs["events"]["getCities"][number];

interface CityPickerModalProps {
  open: boolean;
  currentCitySlug: string;
  onSelect: (slug: string) => void;
  onClose: () => void;
  eventCounts?: Record<string, number>;
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
  const [locating, setLocating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  const { data: cities = [], isLoading: citiesLoading } = trpc.events.getCities.useQuery();

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
    if (open) {
      setQuery("");
      setShowSuggestions(false);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
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

  const handleLocateMe = async () => {
    setLocating(true);
    try {
      const data = await getIPGeolocation();
      if (data && data.latitude && data.longitude) {
        const closest = [...cities]
          .map((c: City) => ({
            ...c,
            dist: calculateDistance(data.latitude, data.longitude, c.lat || 0, c.lng || 0),
          }))
          .sort((a, b) => a.dist - b.dist)[0];
        if (closest) onSelect(closest.slug);
      }
    } catch {
      // silently fail
    } finally {
      setLocating(false);
    }
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return [
      ...cities.filter((c: City) => c.name.toLowerCase().startsWith(q)),
      ...cities.filter(
        (c: City) => !c.name.toLowerCase().startsWith(q) && c.name.toLowerCase().includes(q)
      ),
    ];
  }, [cities, query]);

  const nearbyGrid = useMemo(() => {
    return cities.filter((c: City) => c.slug !== currentCitySlug).slice(0, 6);
  }, [cities, currentCitySlug]);

  if (!visible) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && filtered.length > 0) {
      onSelect(filtered[0].slug);
      setShowSuggestions(false);
    }
    if (e.key === "Escape") {
      if (showSuggestions && query.trim()) {
        setShowSuggestions(false);
      } else {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-6 sm:pt-14 px-3 sm:px-4">
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-280 ${
          animating ? "opacity-60" : "opacity-0"
        }`}
        onClick={onClose}
      />

      <div
        className={`relative w-[94%] sm:w-full max-w-lg sm:max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-280 ease-out ${
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
            <h2 className="text-lg sm:text-xl font-bold text-white font-sora">
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
                className="flex items-center justify-center gap-1.5 pl-2.5 pr-2.5 sm:pr-3.5 py-1.5 my-1.5 mr-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors shrink-0 min-w-[34px]"
              >
                {locating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                ) : (
                  <LocateFixed className="w-3.5 h-3.5 text-indigo-500" />
                )}
                <span className="hidden sm:inline text-xs font-medium text-indigo-600">
                  {locating ? "Locating..." : "Current Location"}
                </span>
              </button>
            </div>

            {query.trim() && showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-10 max-h-56 overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="py-4 text-sm text-gray-400 text-center">No cities found</p>
                ) : (
                  filtered.map((city: City) => (
                    <button
                      key={city.slug}
                      onClick={() => {
                        onSelect(city.slug);
                        setShowSuggestions(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-indigo-50 transition-colors border-b border-gray-50 last:border-0"
                    >
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">
                          <HighlightMatch text={city.name} query={query} />
                        </p>
                        <p className="text-xs text-gray-400">{city.province}</p>
                      </div>
                      {eventCounts[city.slug] && (
                        <span className="text-xs text-indigo-600 font-semibold">
                          {eventCounts[city.slug]} events
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="px-5 sm:px-7 py-6 sm:py-8">
          <h3 className="text-sm font-bold text-gray-900 mb-4 font-sora">Popular Cities</h3>
          {citiesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {nearbyGrid.map((city: City) => (
                <button
                  key={city.slug}
                  onClick={() => onSelect(city.slug)}
                  className="flex flex-col items-start p-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
                >
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-indigo-700">{city.name}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">{city.province}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
