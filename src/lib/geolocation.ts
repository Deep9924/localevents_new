import { CITIES } from "./events-data";

const GEOLOCATION_CACHE_KEY = "localevents_city";
const GEOLOCATION_TIMESTAMP_KEY = "localevents_city_timestamp";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get city slug from IP address using free IP geolocation API
 * This is the primary method - no user permission required
 */
export async function detectCityFromIP(): Promise<string | null> {
  try {
    // Fetch IP geolocation data (primary method)
    const response = await fetch("https://ipapi.co/json/", {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      throw new Error("Geolocation API failed");
    }

    const data = await response.json();
    const city = data.city?.toLowerCase() || null;

    if (city) {
      // Try to find matching city in our CITIES list
      const matchedCity = CITIES.find(
        (c) => c.slug === city || c.name.toLowerCase() === city
      );

      if (matchedCity) {
        // Cache the result for future use
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
export async function getUserCity(): Promise<string> {
  try {
    // Primary: Try to detect from IP first
    const detectedCity = await detectCityFromIP();
    if (detectedCity) {
      return detectedCity;
    }
  } catch (error) {
    console.warn("IP detection error:", error);
  }

  // Fallback: Check if user has saved a city preference
  const savedCity = localStorage.getItem(GEOLOCATION_CACHE_KEY);
  if (savedCity) {
    console.log("Using saved city preference:", savedCity);
    return savedCity;
  }

  // Last resort: Default to Toronto
  console.log("Defaulting to Toronto");
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
