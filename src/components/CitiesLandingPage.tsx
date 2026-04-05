// src/components/CitiesLandingPage.tsx
"use client";

import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { City } from "@/types/trpc";
import { useIPGeolocation } from "@/hooks/useIPGeolocation";

export default function CitiesLandingPage() {
  const router = useRouter();
  const { city: detectedCity, isLoading: detecting } = useIPGeolocation();
  const { data: cities = [] } = trpc.events.getCities.useQuery();
  const { data: cityCounts = {} } = trpc.events.getCountByCity.useQuery();

  const handleSelect = (slug: string) => router.push(`/${slug}`);

  const otherCities = cities.filter((c: City) => c.slug !== detectedCity?.slug);

  // Group by country → province, sorted
  const byCountry = otherCities.reduce<Record<string, Record<string, City[]>>>(
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

  const CityRow = ({ city, featured = false }: { city: City; featured?: boolean }) => (
    <button
      onClick={() => handleSelect(city.slug)}
      className={`w-full group flex items-center gap-3 px-4 py-3 text-left transition-colors
        ${featured
          ? "bg-indigo-600 hover:bg-indigo-700 rounded-xl"
          : "hover:bg-gray-50 rounded-xl"
        }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors
        ${featured ? "bg-white/20" : "bg-gray-100 group-hover:bg-indigo-50"}`}
      >
        <MapPin className={`w-3.5 h-3.5 transition-colors ${featured ? "text-white" : "text-gray-400 group-hover:text-indigo-500"}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-semibold leading-tight ${featured ? "text-white" : "text-gray-800"}`}>
            {city.name}
          </p>
          {featured && (
            <span className="text-[10px] font-medium text-indigo-200 bg-white/10 px-1.5 py-0.5 rounded-full leading-none">
              Near you
            </span>
          )}
        </div>
        <p className={`text-xs mt-0.5 ${featured ? "text-indigo-200" : "text-gray-400"}`}>
          {city.province}
        </p>
      </div>

      {cityCounts[city.slug] !== undefined && (
        <span className={`text-xs shrink-0 ${featured ? "text-indigo-200" : "text-gray-400"}`}>
          {cityCounts[city.slug]} events
        </span>
      )}

      <svg
        className={`w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 transition-all ${featured ? "text-white/50" : "text-gray-300 group-hover:text-gray-500"}`}
        fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
      >
        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-16">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-indigo-700 flex items-center justify-center">
              <span className="text-white font-bold text-xs">LE</span>
            </div>
            <span className="text-sm font-semibold text-indigo-700" style={{ fontFamily: "'Sora', sans-serif" }}>
              LocalEvents
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1.5" style={{ fontFamily: "'Sora', sans-serif" }}>
            Choose your city
          </h1>
          <p className="text-sm text-gray-400">Find local events happening near you.</p>
        </div>

        {/* All cities in one container — detected city first, then grouped */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">

          {/* Detected city skeleton */}
          {detecting && !detectedCity && (
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 animate-pulse shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-28 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          )}

          {/* Detected city row */}
          {detectedCity && <CityRow city={detectedCity} featured />}

          {/* Countries → provinces → cities */}
          {Object.entries(byCountry)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([country, provinces]) => (
              <div key={country}>
                {/* Country label */}
                <div className="px-4 pt-4 pb-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-300">
                    {country}
                  </p>
                </div>

                {/* Provinces sorted */}
                {Object.entries(provinces)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([province, provinceCities]) => (
                    <div key={province}>
                      {/* Province label */}
                      <div className="px-4 pt-2 pb-1">
                        <p className="text-[11px] font-medium text-gray-400">{province}</p>
                      </div>
                      {provinceCities
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((city) => (
                          <CityRow key={city.slug} city={city} />
                        ))}
                    </div>
                  ))}

                <div className="pb-2" />
              </div>
            ))}
        </div>

      </div>
    </div>
  );
}
