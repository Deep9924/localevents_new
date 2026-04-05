// Design: Civic Warmth — IP-based geolocation (no permission needed)
"use client";

import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { City } from "@/types/trpc";

const CACHE_KEY = "le_ip_geo";
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestCity(lat: number, lng: number, cities: City[]): City | null {
  if (!cities.length) return null;
  let nearest = cities[0];
  let minDist = Infinity;
  for (const city of cities) {
    const dist = haversineDistance(lat, lng, city.lat, city.lng);
    if (dist < minDist) { minDist = dist; nearest = city; }
  }
  return nearest;
}

// Cache helpers
function readCache(): { lat: number; lng: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { lat, lng, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) { localStorage.removeItem(CACHE_KEY); return null; }
    return { lat, lng };
  } catch { return null; }
}

function writeCache(lat: number, lng: number) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ lat, lng, ts: Date.now() })); }
  catch { /* storage full or blocked */ }
}

// Fetch with timeout helper
async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// Try multiple providers in order
async function detectCoords(): Promise<{ lat: number; lng: number }> {
  // Provider 1: ipapi.co
  try {
    const res = await fetchWithTimeout("https://ipapi.co/json/", 4000);
    if (res.ok) {
      const d = await res.json();
      if (d.latitude && d.longitude) return { lat: d.latitude, lng: d.longitude };
    }
  } catch { /* try next */ }

  // Provider 2: ip-api.com (fallback, higher rate limit)
  try {
    const res = await fetchWithTimeout("http://ip-api.com/json/?fields=lat,lon,status", 4000);
    if (res.ok) {
      const d = await res.json();
      if (d.status === "success" && d.lat && d.lon) return { lat: d.lat, lng: d.lon };
    }
  } catch { /* give up */ }

  throw new Error("All geolocation providers failed");
}

export function useIPGeolocation() {
  const [city, setCity] = useState<City | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: cities = [] } = trpc.events.getCities.useQuery();

  // Stable ref so the effect doesn't re-run when the cities array
  // reference changes (tRPC returns a new array on each render)
  const citiesRef = useRef<City[]>([]);
  const didRun = useRef(false);

  useEffect(() => {
    if (cities.length > 0) citiesRef.current = cities;
  }, [cities]);

  useEffect(() => {
    // Wait until cities are loaded
    if (cities.length === 0) return;
    // Only run once per mount — prevents double-fire from React Strict Mode
    if (didRun.current) return;
    didRun.current = true;

    const run = async () => {
      try {
        // 1. Check cache first — avoids hitting the API on every page load
        const cached = readCache();
        if (cached) {
          const nearest = findNearestCity(cached.lat, cached.lng, citiesRef.current);
          setCity(nearest);
          setIsLoading(false);
          return;
        }

        // 2. Detect from IP (tries two providers)
        const { lat, lng } = await detectCoords();
        writeCache(lat, lng);

        const nearest = findNearestCity(lat, lng, citiesRef.current);
        setCity(nearest);
        setError(null);
      } catch (err) {
        console.warn("IP geolocation failed:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setCity(null); // don't fall back to cities[0] — let the caller decide
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, [cities]); // eslint-disable-line react-hooks/exhaustive-deps

  return { city, isLoading, error };
}
