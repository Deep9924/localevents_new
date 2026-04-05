import { useState } from "react";
import { Bell, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { trpc } from "@/lib/trpc";
import { City } from "@/types/trpc";
import { useCity } from "@/contexts/CityContext";

interface HeroBannerProps {
  citySlug: string;
  // kept for backwards-compat but no longer required
  isDetecting?: boolean;
  onDetectLocation?: () => void;
}

/** Haversine great-circle distance in km */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function HeroBanner({
  citySlug,
  isDetecting: _isDetectingProp,
  onDetectLocation: _onDetectLocationProp,
}: HeroBannerProps) {
  const router = useRouter();
  const { setCitySlug } = useCity();
  const { data: cities = [] } = trpc.events.getCities.useQuery();

  const city = cities.find((c: City) => c.slug === citySlug);
  const cityName = city?.name ?? "";
  const province = city?.province ?? "";
  const country = city?.country ?? "";

  const [joined, setJoined] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);

  const handleJoin = () => {
    setJoined(true);
    toast.success(`You're now following events in ${cityName}!`);
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    setIsDetecting(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Find the closest city that has lat/lng coordinates
        const citiesWithCoords = (cities as City[]).filter(
          (c) => typeof c.lat === "number" && typeof c.lng === "number"
        );

        if (citiesWithCoords.length === 0) {
          toast.error("No cities with location data found.");
          setIsDetecting(false);
          return;
        }

        let nearest = citiesWithCoords[0];
        let minDist = haversineKm(latitude, longitude, nearest.lat!, nearest.lng!);

        for (const c of citiesWithCoords.slice(1)) {
          const dist = haversineKm(latitude, longitude, c.lat!, c.lng!);
          if (dist < minDist) {
            minDist = dist;
            nearest = c;
          }
        }

        setIsDetecting(false);

        if (nearest.slug === citySlug) {
          toast.success(`You're already viewing events in ${nearest.name}!`);
          return;
        }

        toast.success(`Switched to ${nearest.name} — closest city to you.`);
        setCitySlug(nearest.slug);
        router.push(`/${nearest.slug}`);
      },
      (err) => {
        setIsDetecting(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            toast.error("Location permission denied. Please allow access and try again.");
            break;
          case err.POSITION_UNAVAILABLE:
            toast.error("Your location is currently unavailable.");
            break;
          case err.TIMEOUT:
            toast.error("Location request timed out. Please try again.");
            break;
          default:
            toast.error("Could not detect your location.");
        }
      },
      { timeout: 10_000, maximumAge: 60_000 }
    );
  };

  return (
    <section className="py-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative overflow-hidden bg-slate-950 rounded-3xl">
          {/* Background image */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-60"
            style={{
              backgroundImage:
                "url(https://d2xsxph8kpxj0f.cloudfront.net/310519663417415848/NNyqgxtPidN4Wy7fHnA2ZS/hero-banner-k2PJ7aKE5AtZqoZvRtbUz6.webp)",
            }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/85 to-amber-900/30" />

          {/* Content */}
          <div className="relative px-6 py-8 sm:py-10">
            <div className="max-w-2xl space-y-4">
              {/* Location row */}
              <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-200/80 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span style={{ fontFamily: "'Sora', sans-serif" }}>
                    {province}, {country}
                  </span>
                </div>
              </div>

              {/* Heading */}
              <h1
                className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                Events bringing{" "}
                <span className="text-amber-300">{cityName}</span> together
              </h1>

              <p
                className="text-slate-100/85 text-sm leading-relaxed max-w-lg"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                Discover concerts, meetups, open mics, art shows and more — all
                happening in {cityName} this week.
              </p>

              {/* Buttons */}
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={handleJoin}
                  disabled={joined}
                  className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-white font-semibold text-xs sm:text-sm px-4 sm:px-6 py-2.5 shadow-sm shadow-amber-200/30 transition-colors duration-200 whitespace-nowrap"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  {joined ? "Following!" : "Join the community"}
                </button>

                <button
                  onClick={handleDetectLocation}
                  disabled={isDetecting}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 hover:bg-white/15 disabled:opacity-60 text-white font-medium text-xs sm:text-sm px-4 sm:px-6 py-2.5 backdrop-blur-sm transition-colors duration-200 whitespace-nowrap"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  {isDetecting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                      Detecting…
                    </>
                  ) : (
                    <>
                      <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                      Use my location
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
