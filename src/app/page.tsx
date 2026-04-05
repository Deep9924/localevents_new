"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useIPGeolocation } from "@/hooks/useIPGeolocation";
import { trpc } from "@/lib/trpc";
import { useCity } from "@/contexts/CityContext";

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

export default function Home() {
  const router = useRouter();
  const { setCitySlug } = useCity();
  const { data: cities = [] } = trpc.events.getCities.useQuery();
  const { city: detectedCity, isLoading: detecting } = useIPGeolocation();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Wait until both IP detection and cities list are ready
    if (detecting || cities.length === 0 || hasRedirected.current) return;

    hasRedirected.current = true;

    if (detectedCity?.lat && detectedCity?.lng) {
      // Find nearest city to detected coordinates
      const nearest = [...cities]
        .map((c) => ({
          ...c,
          dist: haversine(detectedCity.lat!, detectedCity.lng!, c.lat, c.lng),
        }))
        .sort((a, b) => a.dist - b.dist)[0];

      if (nearest) {
        setCitySlug(nearest.slug);
        router.replace(`/${nearest.slug}`);
        return;
      }
    }

    // Detection finished but no coordinates — go to city picker
    router.replace("/cities");
  }, [detecting, cities, detectedCity, router, setCitySlug]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-gray-500 text-sm">Finding events near you…</p>
      </div>
    </div>
  );
}
