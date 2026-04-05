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

  const otherCities = cities.filter((c: City) => c.slug !== detectedCity?.slug);

  // Group by country only
  const byCountry = otherCities.reduce<Record<string, City[]>>((acc, city: City) => {
    const key = city.country ?? "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(city);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-amber-50">
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">

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

        {/* Detected city */}
        {detectedCity && (
          <div className="mb-10">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <MapPin className="w-3 h-3" />Your location
            </p>
            <button
              onClick={() => router.push(`/${detectedCity.slug}`)}
              className="w-full group bg-white rounded-xl border-2 border-indigo-400 p-4 transition-all hover:shadow-md text-left flex items-center justify-between"
            >
              <div>
                <h3 className="text-base font-bold text-indigo-900 group-hover:text-indigo-600 transition-colors" style={{ fontFamily: "'Sora', sans-serif" }}>
                  {detectedCity.name}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">{detectedCity.province} · {detectedCity.country}</p>
                {cityCounts[detectedCity.slug] !== undefined && (
                  <p className="text-xs text-indigo-400 mt-0.5">{cityCounts[detectedCity.slug]} events</p>
                )}
              </div>
              <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all shrink-0" />
            </button>
          </div>
        )}

        {/* Cities by country */}
        {Object.entries(byCountry)
          .sort(([a], [b]) => {
            if (a === "Canada") return -1;
            if (b === "Canada") return 1;
            if (a === "United States" || a === "US" || a === "USA") return -1;
            if (b === "United States" || b === "US" || b === "USA") return 1;
            return a.localeCompare(b);
          })
          .map(([country, countryCities]) => (
          <div key={country} className="mb-8">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{country}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {countryCities.map((city: City) => (
                <button
                  key={city.slug}
                  onClick={() => router.push(`/${city.slug}`)}
                  className="group bg-white rounded-xl border border-gray-200 hover:border-indigo-300 shadow-sm p-3.5 transition-all hover:shadow-md text-left flex items-start justify-between gap-2"
                >
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors truncate" style={{ fontFamily: "'Sora', sans-serif" }}>
                      {city.name}
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5 truncate">{city.province}</p>
                    {cityCounts[city.slug] !== undefined && (
                      <p className="text-[11px] text-gray-300 mt-0.5">{cityCounts[city.slug]} events</p>
                    )}
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                </button>
              ))}
            </div>
          </div>
        ))}

      </section>
    </div>
  );
}
