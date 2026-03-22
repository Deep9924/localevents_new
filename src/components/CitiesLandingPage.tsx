// src/components/CitiesLandingPage.tsx
"use client";

import { useRouter } from "next/navigation";
import { MapPin, ArrowRight } from "lucide-react";
import { CITIES } from "@/lib/events-data";
import { useIPGeolocation } from "@/hooks/useIPGeolocation";

export default function CitiesLandingPage() {
  const router = useRouter();
  const { city: detectedCity } = useIPGeolocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-amber-50">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-indigo-900 mb-4">Discover Events Near You</h2>
          <p className="text-lg text-indigo-700 max-w-2xl mx-auto">Find concerts, meetups, festivals, and more in your city.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CITIES.map((city) => (
            <button key={city.slug} onClick={() => router.push(`/${city.slug}`)}
              className={`group bg-white rounded-lg border p-6 transition-all hover:shadow-lg hover:scale-105 text-left ${detectedCity?.slug === city.slug ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-300" : "border-indigo-100 hover:border-indigo-300"}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-xl font-bold text-indigo-900 group-hover:text-indigo-600 transition-colors">{city.name}</h3>
                  <p className="text-sm text-indigo-600">{city.province}, {city.country}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-indigo-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
              </div>
              {detectedCity?.slug === city.slug && (
                <div className="mt-3 text-xs font-medium text-indigo-600 flex items-center gap-1"><MapPin className="w-3 h-3" />Your location</div>
              )}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
