// Design: Civic Warmth — Geolocation hook for dynamic city detection using IP-based location
"use client";

import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
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

const DEFAULT_CITY: City = {
  slug: "toronto",
  name: "Toronto",
  province: "Ontario",
  country: "Canada",
  lat: 43.6532,
  lng: -79.3832,
};

export function useLocation(urlCitySlug?: string) {
  const [state, setState] = useState<LocationState>({
    city: null,
    citySlug: urlCitySlug || "toronto",
    isDetecting: !urlCitySlug,
    error: null,
    permissionDenied: false,
    hasDetectionAttempted: !!urlCitySlug,
  });

  const { data: cities = [] } = trpc.events.getCities.useQuery();

  const detectLocation = useCallback(async (forceRefresh = false) => {
    if (cities.length === 0) return;
    setState((prev) => ({ ...prev, isDetecting: true, error: null }));

    try {
      // Use IP-based geolocation (no permission required)
      const detectedSlug = await getUserCity(forceRefresh);
      const found = cities.find((c: City) => c.slug === detectedSlug);

      if (found) {
        setState({
          city: found,
          citySlug: found.slug,
          isDetecting: false,
          error: null,
          permissionDenied: false,
          hasDetectionAttempted: true,
        });
        saveCityPreference(found.slug);
        return found.slug;
      } else {
        // Fallback to default city
        setState({
          city: DEFAULT_CITY,
          citySlug: DEFAULT_CITY.slug,
          isDetecting: false,
          error: null,
          permissionDenied: false,
          hasDetectionAttempted: true,
        });
        return DEFAULT_CITY.slug;
      }
    } catch (error) {
      // Fallback to default city on error
      setState({
        city: DEFAULT_CITY,
        citySlug: DEFAULT_CITY.slug,
        isDetecting: false,
        error: "Could not detect location",
        permissionDenied: false,
        hasDetectionAttempted: true,
      });
      return DEFAULT_CITY.slug;
    }
  }, [cities]);

  useEffect(() => {
    if (cities.length === 0) return;

    if (urlCitySlug) {
      // URL has a city slug — use it directly
      const found = cities.find((c: City) => c.slug === urlCitySlug);
      setState({
        city: found || null,
        citySlug: urlCitySlug,
        isDetecting: false,
        error: found ? null : "City not found",
        permissionDenied: false,
        hasDetectionAttempted: true,
      });
      // Save the user's choice
      if (found) {
        saveCityPreference(found.slug);
      }
    } else {
      // No URL city — detect from IP geolocation
      detectLocation();
    }
  }, [urlCitySlug, detectLocation, cities]);

  return { ...state, detectLocation };
}
