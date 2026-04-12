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
    <section className="py-4 sm:py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative overflow-hidden bg-stone-900 rounded-[2rem] shadow-2xl shadow-stone-200/50">
          {/* Background image */}
          <div className="absolute inset-0 opacity-40">
            <Image
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663417415848/NNyqgxtPidN4Wy7fHnA2ZS/hero-banner-k2PJ7aKE5AtZqoZvRtbUz6.webp"
              alt="Hero background"
              fill
              priority
              className="object-cover object-center scale-105"
            />
          </div>
          
          {/* Sophisticated Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-900/80 to-amber-900/20" />

          {/* Content */}
          <div className="relative px-8 py-12 sm:py-20 lg:py-24">
            <div className="max-w-3xl space-y-6">
              {/* Location row */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-medium text-stone-200">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>{province}, {country}</span>
              </div>

              {/* Heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1]">
                Events bringing{" "}
                <span className="text-amber-400 italic"> {cityName} </span> together
              </h1>

              <p className="text-stone-300 text-lg sm:text-xl leading-relaxed max-w-xl font-light">
                Discover concerts, meetups, and art shows happening in {cityName} this week.
              </p>

              {/* Buttons */}
              <div className="flex flex-wrap gap-4 pt-4">
                <Button
                  onClick={handleJoin}
                  disabled={joined}
                  size="lg"
                  className="rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-8 py-6 text-base shadow-xl shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
                >
                  <Bell className="mr-2 h-5 w-5" />
                  {joined ? "Following!" : "Join the community"}
                </Button>

                <Button
                  onClick={handleDetectLocation}
                  disabled={isDetecting}
                  variant="outline"
                  size="lg"
                  className="rounded-full border-white/20 bg-white/5 hover:bg-white/10 text-white font-semibold px-8 py-6 text-base backdrop-blur-md transition-all hover:scale-105 active:scale-95"
                >
                  {isDetecting ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <MapPin className="mr-2 h-5 w-5" />
                  )}
                  Use my location
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
