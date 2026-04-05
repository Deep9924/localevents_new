// src/components/CitiesLandingPage.tsx
"use client";

import { useRouter } from "next/navigation";
import { MapPin, Sparkles } from "lucide-react";
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

  const byCountry = otherCities.reduce<Record<string, City[]>>((acc, city: City) => {
    const key = city.country ?? "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(city);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#F7F7F5]">

      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-700 flex items-center justify-center">
              <span className="text-white font-bold text-xs">LE</span>
            </div>
            <span className="text-sm font-semibold text-indigo-700" style={{ fontFamily: "'Sora', sans-serif" }}>LocalEvents</span>
          </div>
          <h1
            className="text-3xl sm:text-4xl font-bold text-gray-950 mb-2 leading-tight"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            Find events in your city
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Concerts, meetups, markets and more — pick your city to get started.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-8 space-y-10">

        {/* Detected city */}
        {(detectedCity || detecting) && (
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />Detected near you
            </p>

            {detecting && !detectedCity ? (
              <div className="h-[88px] rounded-2xl bg-white border border-gray-100 animate-pulse" />
            ) : detectedCity ? (
              <button
                onClick={() => handleSelect(detectedCity.slug)}
                className="w-full group relative bg-white hover:bg-indigo-50 border border-gray-100 hover:border-indigo-200 rounded-2xl px-5 py-4 text-left transition-all duration-150 flex items-center gap-4"
              >
                {/* Color accent */}
                <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-700 transition-colors">
                  <MapPin className="w-5 h-5 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-base font-semibold text-gray-900">{detectedCity.name}</p>
                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">Your location</span>
                  </div>
                  <p className="text-xs text-gray-400">{detectedCity.province}, {detectedCity.country}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {cityCounts[detectedCity.slug] !== undefined && (
                    <span className="text-sm font-medium text-gray-400">
                      {cityCounts[detectedCity.slug]} events
                    </span>
                  )}
                  <div className="w-7 h-7 rounded-full bg-gray-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                    <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </button>
            ) : null}
          </section>
        )}

        {/* All cities by country */}
        {Object.entries(byCountry).map(([country, countryCities]) => (
          <section key={country}>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3">{country}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {countryCities.map((city: City) => (
                <button
                  key={city.slug}
                  onClick={() => handleSelect(city.slug)}
                  className="group bg-white hover:bg-gray-50 border border-gray-100 hover:border-gray-200 rounded-xl px-4 py-3.5 text-left transition-all duration-150 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-indigo-50 flex items-center justify-center shrink-0 transition-colors">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 leading-tight">{city.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{city.province}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {cityCounts[city.slug] !== undefined && (
                      <span className="text-xs text-gray-400">{cityCounts[city.slug]}</span>
                    )}
                    <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}

      </div>
    </div>
  );
}
