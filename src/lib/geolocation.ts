// src/lib/geolocation.ts
const GEOLOCATION_CACHE_KEY = "localevents_city";
const GEOLOCATION_TIMESTAMP_KEY = "localevents_city_timestamp";

interface CitySlugMatch {
  slug: string;
  name: string;
}

/**
 * Get city slug from IP address using free IP geolocation API
 * This is the primary method - no user permission required
 */
export async function detectCityFromIP(cities: CitySlugMatch[]): Promise<string | null> {
  try {
    const response = await fetch("https://ipapi.co/json/", {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error("Geolocation API failed");
    }

    const data = await response.json();
    const city = data.city?.toLowerCase() || null;

    if (city) {
      const matchedCity = cities.find(
        (c) => c.slug === city || c.name.toLowerCase() === city
      );

      if (matchedCity) {
        localStorage.setItem(GEOLOCATION_CACHE_KEY, matchedCity.slug);
        localStorage.setItem(GEOLOCATION_TIMESTAMP_KEY, Date.now().toString());
        return matchedCity.slug;
      }
    }

    return null;
  } catch (error) {
    console.warn("IP-based geolocation detection failed:", error);
    return null;
  }
}

/**
 * Get the user's city slug, with priority logic:
 * 1. Try IP-based geolocation (primary - no permission required)
 * 2. Fall back to localStorage saved preference
 * 3. Default to Toronto
 */
export async function getUserCity(cities: CitySlugMatch[]): Promise<string> {
  try {
    const detectedCity = await detectCityFromIP(cities);
    if (detectedCity) {
      return detectedCity;
    }
  } catch (error) {
    console.warn("IP detection error:", error);
  }

  const savedCity = localStorage.getItem(GEOLOCATION_CACHE_KEY);
  if (savedCity) {
    return savedCity;
  }

  return "toronto";
}

/**
 * Save user's city preference to localStorage
 */
export function saveCityPreference(citySlug: string): void {
  localStorage.setItem(GEOLOCATION_CACHE_KEY, citySlug);
  localStorage.setItem(GEOLOCATION_TIMESTAMP_KEY, Date.now().toString());
}

/**
 * Clear cached city preference
 */
export function clearCityPreference(): void {
  localStorage.removeItem(GEOLOCATION_CACHE_KEY);
  localStorage.removeItem(GEOLOCATION_TIMESTAMP_KEY);
}
