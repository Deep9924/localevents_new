// src/components/CitiesLandingPage.tsx
"use client";

import { useRouter } from "next/navigation";
import { MapPin, ArrowRight, Navigation } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { City } from "@/types/trpc";
import { useIPGeolocation } from "@/hooks/useIPGeolocation";

export default function CitiesLandingPage() {
  const router = useRouter();
  const { city: detectedCity } = useIPGeolocation();
  const { data: cities = [] } = trpc.events.getCities.useQuery();
  const { data: cityCounts = {} } = trpc.events.getCountByCity.useQuery();

  // Group cities by country → province, excluding detected city
  const otherCities = cities.filter((c: City) => c.slug !== detectedCity?.slug);

  const grouped = otherCities.reduce<Record<string, Record<string, City[]>>>(
    (acc, city: City) => {
      const country = city.country ?? "Other";
      const province = city.province ?? "Other";
      if (!acc[country]) acc[country] = {};
      if (!acc[country][province]) acc[country][province] = [];
      acc[country][province].push(city);
      return acc;
    },
    {}
  );

  const handleSelect = (slug: string) => router.push(`/${slug}`);

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-2xl sm:text-3xl font-bold text-gray-950 mb-1"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            Choose your city
          </h1>
          <p className="text-sm text-gray-400">Find events happening near you.</p>
        </div>

        {/* Detected city — pinned at top */}
        {detectedCity && (
          <div className="mb-8">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Navigation className="w-3 h-3" />Your location
            </p>
            <button
              onClick={() => handleSelect(detectedCity.slug)}
              className="w-full flex items-center gap-3 px-4 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-2xl text-left transition-colors group"
            >
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white leading-tight">{detectedCity.name}</p>
                <p className="text-xs text-indigo-200 mt-0.5">{detectedCity.province}, {detectedCity.country}</p>
              </div>
              {cityCounts[detectedCity.slug] !== undefined && (
                <span className="text-xs font-medium text-indigo-200 shrink-0">
                  {cityCounts[detectedCity.slug]} events
                </span>
              )}
              <ArrowRight className="w-4 h-4 text-white/70 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </button>
          </div>
        )}

        {/* Grouped by country → province */}
        <div className="space-y-7">
          {Object.entries(grouped).map(([country, provinces]) => (
            <div key={country}>
              {/* Country heading */}
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
                {country}
              </p>

              <div className="space-y-5">
                {Object.entries(provinces).map(([province, provinceCities]) => (
                  <div key={province}>
                    {/* Province sub-heading */}
                    <p className="text-xs font-medium text-gray-400 mb-2 pl-0.5">{province}</p>

                    {/* City rows */}
                    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden divide-y divide-gray-50">
                      {provinceCities.map((city: City) => {
                        const count = cityCounts[city.slug];
                        return (
                          <button
                            key={city.slug}
                            onClick={() => handleSelect(city.slug)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors group"
                          >
                            <MapPin className="w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-400 transition-colors shrink-0" />
                            <span className="flex-1 text-sm font-medium text-gray-800 leading-tight">
                              {city.name}
                            </span>
                            {count !== undefined && (
                              <span className="text-xs text-gray-400 shrink-0">{count} events</span>
                            )}
                            <ArrowRight className="w-3.5 h-3.5 text-gray-200 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
