// src/lib/detectCity.ts
import { calculateDistance } from "@/lib/utils";

export type CityRecord = { slug: string; lat: number; lng: number };

// Canonical list of supported Canadian city slugs
const CANADIAN_CITY_SLUGS = [
  "toronto", "vancouver", "calgary", "edmonton",
  "montreal", "ottawa", "winnipeg", "regina",
];

function nearestCity(lat: number, lng: number, cities: CityRecord[]): string | null {
  if (!cities.length) return null;
  return cities.reduce(
    (best, city) => {
      const d = calculateDistance(lat, lng, city.lat, city.lng);
      return d < best.dist ? { slug: city.slug, dist: d } : best;
    },
    { slug: cities[0]!.slug, dist: Infinity }
  ).slug;
}

export async function detectCityFromIp(
  ip: string,
  cities: CityRecord[]
): Promise<string | null> {
  if (!cities.length) return null;
  if (
    !ip ||
    ip === "unknown" ||
    ip === "::1" ||
    ip.startsWith("127.") ||
    ip.startsWith("192.168.")
  ) return null;

  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });
    const data = await res.json();

    const isCanada = data.country_code === "CA";
    const pool = isCanada
      ? cities.filter((c) => CANADIAN_CITY_SLUGS.includes(c.slug))
      : cities;

    if (!pool.length) return null;

    const exact = data.city?.toLowerCase().replace(/\s+/g, "-");
    if (exact && pool.find((c) => c.slug === exact)) return exact;

    return nearestCity(data.latitude, data.longitude, pool);
  } catch {
    return null;
  }
}