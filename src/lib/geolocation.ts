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

/**
 * Get the user's city slug with priority:
 * 1. Valid cached preference (< 24h old)
 * 2. Cookie-based preference (set by server or previous session)
 * 3. Active IP-based detection (if forceRefresh is true)
 * 4. Default to Toronto
 */
export async function getUserCity(forceRefresh = false): Promise<string> {
  if (!isBrowser()) return "toronto";

  // 1. Return valid cache immediately unless forcing refresh
  if (!forceRefresh) {
    const cached = getCachedCity();
    if (cached) return cached;

    // 2. Check for cookie preference
    const cookieMatch = document.cookie.match(/city=([^;]+)/);
    if (cookieMatch && cookieMatch[1]) {
      const cookieCity = cookieMatch[1];
      saveCityPreference(cookieCity);
      return cookieCity;
    }
  }

  // 3. Active IP-based detection
  try {
    const res = await fetch("https://ipapi.co/json/", { 
      signal: AbortSignal.timeout(4000) 
    });
    if (res.ok) {
      const data = await res.json();
      if (data.city) {
        // Simple slugification for common Canadian cities
        const detectedCity = data.city.toLowerCase().replace(/\s+/g, "-");
        // We don't validate against the DB here, useLocation will do that
        return detectedCity;
      }
    }
  } catch (e) {
    console.error("IP detection failed:", e);
  }

  // 4. Fallback to stale cache or default
  const stale = localStorage.getItem(GEOLOCATION_CACHE_KEY);
  if (stale) return stale;

  return "toronto";
}

export function saveCityPreference(citySlug: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(GEOLOCATION_CACHE_KEY, citySlug);
  localStorage.setItem(GEOLOCATION_TIMESTAMP_KEY, Date.now().toString());
  // Also update cookie for server-side awareness
  document.cookie = `city=${citySlug}; path=/; max-age=${60 * 60 * 24 * 365}`;
}

export function clearCityPreference(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(GEOLOCATION_CACHE_KEY);
  localStorage.removeItem(GEOLOCATION_TIMESTAMP_KEY);
  document.cookie = "city=; path=/; max-age=-1";
}
