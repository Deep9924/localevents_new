// src/hooks/useLocation.ts
// Design: Civic Warmth — Geolocation hook for dynamic city detection using IP-based location
"use client";

import { useState, useEffect, useCallback } from "react";
import { City } from "@/types/trpc";
import { getUserCity, saveCityPreference } from "@/lib/geolocation";

export interface LocationState {
  city: City | null;
  citySlug: string;
  isDetecting: boolean;
  error: string | null;
  permissionDenied: boolean;
  hasDetectionAttempted: boolean;
}

export function useLocation(urlCitySlug?: string, cities: City[] = []) {
  const [state, setState] = useState<LocationState>({
    city: null,
    citySlug: urlCitySlug || "toronto",
    isDetecting: !urlCitySlug,
    error: null,
    permissionDenied: false,
    hasDetectionAttempted: !!urlCitySlug,
  });

  const detectLocation = useCallback(async () => {
    if (!cities.length) return;

    setState((prev) => ({ ...prev, isDetecting: true, error: null }));

    try {
      const detectedSlug = await getUserCity(cities);
      const found = cities.find((c) => c.slug === detectedSlug);
      const fallback = cities[0] ?? null;

      setState({
        city: found ?? fallback,
        citySlug: found?.slug ?? fallback?.slug ?? "toronto",
        isDetecting: false,
        error: null,
        permissionDenied: false,
        hasDetectionAttempted: true,
      });

      if (found) saveCityPreference(found.slug);
    } catch {
      const fallback = cities[0] ?? null;
      setState({
        city: fallback,
        citySlug: fallback?.slug ?? "toronto",
        isDetecting: false,
        error: "Could not detect location",
        permissionDenied: false,
        hasDetectionAttempted: true,
      });
    }
  }, [cities]);

  useEffect(() => {
    if (!cities.length) return;

    if (urlCitySlug) {
      const found = cities.find((c) => c.slug === urlCitySlug);
      setState({
        city: found || null,
        citySlug: urlCitySlug,
        isDetecting: false,
        error: found ? null : "City not found",
        permissionDenied: false,
        hasDetectionAttempted: true,
      });
      if (found) saveCityPreference(found.slug);
    } else {
      detectLocation();
    }
  }, [urlCitySlug, cities, detectLocation]);

  return { ...state, detectLocation };
}
