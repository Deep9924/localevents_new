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

  // Separate detected city from the rest
  const otherCities = cities.filter((c: City) => c.slug !== detectedCity?.slug);

  // Group by country → province
  const grouped = otherCities.reduce<Record<string, Record<string, City[]>>>((acc, city: City) => {
    const country = city.country ?? "Other";
    const province = city.province ?? "Other";
    if (!acc[country]) acc[country] = {};
    if (!acc[country][province]) acc[country][province] = [];
    acc[country][province].push(city);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-amber-50">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">

        <div className="text-center mb-10">
          <h2
            className="text-4xl sm:text-5xl font-bold text-indigo-900 mb-4"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            Discover Events Near You
          </h2>
          <p className="text-lg text-indigo-700 max-w-2xl mx-auto">
            Find concerts, meetups, festivals, and more in your city.
          </p>
        </div>

        {/* Detected city — pinned at top, full width */}
        {detectedCity && (
          <div className="mb-8">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />Your location
            </p>
            <button
              onClick={() => router.push(`/${detectedCity.slug}`)}
              className="w-full group bg-white rounded-xl border-2 border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200 px-4 py-3 transition-all hover:shadow-md hover:scale-[1.005] text-left flex items-center justify-between"
            >
              <div>
                <h3
                  className="text-base font-bold text-indigo-900 group-hover:text-indigo-600 transition-colors"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  {detectedCity.name}
                </h3>
                <p className="text-sm text-indigo-500 mt-0.5">
                  {detectedCity.province}, {detectedCity.country}
                </p>
                {cityCounts[detectedCity.slug] !== undefined && (
                  <p className="text-xs text-indigo-400 mt-1">
                    {cityCounts[detectedCity.slug]} events
                  </p>
                )}
              </div>
              <ArrowRight className="w-5 h-5 text-indigo-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all shrink-0" />
            </button>
          </div>
        )}

        {/* Remaining cities grouped by country → province */}
        {Object.entries(grouped).map(([country, provinces]) => (
          <div key={country} className="mb-8">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-4">
              {country}
            </p>
            {Object.entries(provinces).map(([province, provinceCities]) => (
              <div key={province} className="mb-4">
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2 pl-0.5">
                  {province}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {provinceCities.map((city: City) => (
                    <button
                      key={city.slug}
                      onClick={() => router.push(`/${city.slug}`)}
                      className="group bg-white rounded-lg border border-indigo-100 hover:border-indigo-300 px-3 py-2.5 transition-all hover:shadow-sm hover:scale-[1.02] text-left flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <h3
                          className="text-sm font-semibold text-indigo-900 group-hover:text-indigo-600 transition-colors truncate"
                          style={{ fontFamily: "'Sora', sans-serif" }}
                        >
                          {city.name}
                        </h3>
                        {cityCounts[city.slug] !== undefined && (
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {cityCounts[city.slug]} events
                          </p>
                        )}
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}

      </section>
    </div>
  );
}
