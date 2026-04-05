// src/components/CitiesLandingPage.tsx
"use client";

import { useRouter } from "next/navigation";
import { MapPin, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { City } from "@/types/trpc";
import { useIPGeolocation } from "@/hooks/useIPGeolocation";

export default function CitiesLandingPage() {
  const router = useRouter();
  const { city: detectedCity } = useIPGeolocation();
  const { data: cities = [] } = trpc.events.getCities.useQuery();
  const { data: cityCounts = {} } = trpc.events.getCountByCity.useQuery();

  const handleSelect = (slug: string) => router.push(`/${slug}`);

  // Group non-detected cities by country
  const otherCities = cities.filter((c: City) => c.slug !== detectedCity?.slug);

  const byCountry = otherCities.reduce<Record<string, City[]>>((acc, city: City) => {
    const key = city.country ?? "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(city);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-5 pt-12 pb-16">

        <h1
          className="text-2xl font-bold text-gray-900 mb-1"
          style={{ fontFamily: "'Sora', sans-serif" }}
        >
          Where are you?
        </h1>
        <p className="text-sm text-gray-400 mb-10">Pick a city to see local events.</p>

        {/* Detected city */}
        {detectedCity && (
          <div className="mb-8">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-300 mb-3">
              Near you
            </p>
            <button
              onClick={() => handleSelect(detectedCity.slug)}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-indigo-300 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">{detectedCity.name}</p>
                  <p className="text-xs text-indigo-300">{detectedCity.province}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {cityCounts[detectedCity.slug] !== undefined && (
                  <span className="text-xs text-indigo-300">{cityCounts[detectedCity.slug]} events</span>
                )}
                <ArrowRight className="w-4 h-4 text-indigo-300 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>
        )}

        {/* Cities by country */}
        {Object.entries(byCountry).map(([country, countryCities]) => (
          <div key={country} className="mb-8">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-300 mb-3">
              {country}
            </p>
            <div className="space-y-0.5">
              {countryCities.map((city: City) => (
                <button
                  key={city.slug}
                  onClick={() => handleSelect(city.slug)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors group text-left"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-400 transition-colors shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{city.name}</p>
                      <p className="text-xs text-gray-400">{city.province}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {cityCounts[city.slug] !== undefined && (
                      <span className="text-xs text-gray-300">{cityCounts[city.slug]} events</span>
                    )}
                    <ArrowRight className="w-3.5 h-3.5 text-gray-200 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}
