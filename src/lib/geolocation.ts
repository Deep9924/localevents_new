// src/lib/geolocation.ts — client-side only ("use client" components)

const GEOLOCATION_CACHE_KEY = "localevents_city";
const GEOLOCATION_TIMESTAMP_KEY = "localevents_city_timestamp";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function getCachedCity(): string | null {
  if (!isBrowser()) return null;
  const cached = localStorage.getItem(GEOLOCATION_CACHE_KEY);
  const ts = localStorage.getItem(GEOLOCATION_TIMESTAMP_KEY);
  if (cached && ts && Date.now() - Number(ts) < CACHE_DURATION) return cached;
  return null;
}

async function fetchCityFromIP(): Promise<string | null> {
  try {
    const response = await fetch("https://ipapi.co/json/", {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error("Geolocation API failed");
    const data = await response.json();
    const citySlug = data.city?.toLowerCase().replace(/\s+/g, "-") ?? null;
    if (citySlug && isBrowser()) {
      localStorage.setItem(GEOLOCATION_CACHE_KEY, citySlug);
      localStorage.setItem(GEOLOCATION_TIMESTAMP_KEY, Date.now().toString());
    }
    return citySlug;
  } catch (error) {
    console.warn("IP-based geolocation detection failed:", error);
    return null;
  }
}

/**
 * Get the user's city slug with priority:
 * 1. Valid cached preference (< 24h old) — avoids unnecessary API call
 * 2. IP-based detection — fresh fetch on first visit or stale cache
 * 3. Default to Toronto
 */
export async function getUserCity(): Promise<string> {
  if (!isBrowser()) return "toronto";

  // 1. Return valid cache immediately
  const cached = getCachedCity();
  if (cached) return cached;

  // 2. Detect from IP
  try {
    const detected = await fetchCityFromIP();
    if (detected) return detected;
  } catch (error) {
    console.warn("IP detection error:", error);
  }

  // 3. Stale cache is better than nothing
  const stale = isBrowser() ? localStorage.getItem(GEOLOCATION_CACHE_KEY) : null;
  if (stale) return stale;

  return "toronto";
}

export function saveCityPreference(citySlug: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(GEOLOCATION_CACHE_KEY, citySlug);
  localStorage.setItem(GEOLOCATION_TIMESTAMP_KEY, Date.now().toString());
}

export function clearCityPreference(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(GEOLOCATION_CACHE_KEY);
  localStorage.removeItem(GEOLOCATION_TIMESTAMP_KEY);
}