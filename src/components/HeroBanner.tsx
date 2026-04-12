import { useState } from "react";
import { Bell, MapPin, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { trpc } from "@/lib/trpc";
import { useCity } from "@/contexts/CityContext";
import { AppRouter } from "@/server/routers/root";
import { inferRouterOutputs } from "@trpc/server";
import { Button } from "@/components/ui/button";

type RouterOutput = inferRouterOutputs<AppRouter>;
type City = RouterOutput["events"]["getCities"][number];

interface HeroBannerProps {
  citySlug: string;
}

export default function HeroBanner({ citySlug }: HeroBannerProps) {
  const router = useRouter();
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
    setIsDetecting(true);
    toast.info("Refreshing location...");
    router.refresh();
    setTimeout(() => setIsDetecting(false), 1000);
  };

  return (
    <section className="py-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative overflow-hidden bg-slate-950 rounded-3xl">
          {/* Background image */}
          <div className="absolute inset-0 opacity-60">
            <Image
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663417415848/NNyqgxtPidN4Wy7fHnA2ZS/hero-banner-k2PJ7aKE5AtZqoZvRtbUz6.webp"
              alt="Hero background"
              fill
              priority
              className="object-cover object-center"
            />
          </div>
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/85 to-amber-900/30" />

          {/* Content */}
          <div className="relative px-6 py-8 sm:py-10">
            <div className="max-w-2xl space-y-4">
              {/* Location row */}
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-200/80">
                <MapPin className="w-4 h-4" />
                <span style={{ fontFamily: "'Sora', sans-serif" }}>
                  {province}, {country}
                </span>
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
                <Button
                  onClick={handleJoin}
                  disabled={joined}
                  className="rounded-full bg-amber-500 hover:bg-amber-400 text-white font-semibold text-xs sm:text-sm px-4 sm:px-6 py-2.5 shadow-sm shadow-amber-200/30 transition-colors duration-200 whitespace-nowrap"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 mr-1.5" />
                  {joined ? "Following!" : "Join the community"}
                </Button>

                <Button
                  onClick={handleDetectLocation}
                  disabled={isDetecting}
                  variant="outline"
                  className="rounded-full border-white/20 bg-white/10 hover:bg-white/15 text-white font-medium text-xs sm:text-sm px-4 sm:px-6 py-2.5 backdrop-blur-sm transition-colors duration-200 whitespace-nowrap"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  {isDetecting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 mr-1.5" />
                      Detecting…
                    </>
                  ) : (
                    <>
                      <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 mr-1.5" />
                      Use my location
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
