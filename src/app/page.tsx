"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useLocation } from "@/hooks/useLocation";
import { useCity } from "@/contexts/CityContext";

export default function Home() {
  const router = useRouter();
  const { setCitySlug } = useCity();
  const { city: detectedCity, isDetecting: detecting } = useLocation();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (detecting || hasRedirected.current) return;

    hasRedirected.current = true;

    if (detectedCity) {
      setCitySlug(detectedCity.slug);
      router.replace(`/${detectedCity.slug}`);
    } else {
      router.replace("/cities");
    }
  }, [detecting, detectedCity, router, setCitySlug]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-gray-500 text-sm">Finding events near you…</p>
      </div>
    </div>
  );
}