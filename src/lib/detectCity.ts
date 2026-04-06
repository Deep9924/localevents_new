export type CityRecord = { slug: string; lat: number; lng: number };

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearestCity(lat: number, lng: number, cities: CityRecord[]): string {
  return cities.reduce(
    (best, city) => {
      const d = haversineKm(lat, lng, city.lat, city.lng);
      return d < best.dist ? { slug: city.slug, dist: d } : best;
    },
    { slug: cities[0].slug, dist: Infinity }
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

    // Only snap to Canadian cities if visitor is in Canada
    const isCanada = data.country_code === "CA";
    const canadianCities = cities.filter((c) =>
      ["toronto","vancouver","calgary","edmonton","montreal","ottawa","winnipeg","regina"].includes(c.slug)
    );
    const pool = isCanada ? canadianCities : cities;
    if (!pool.length) return null;

    const exact = data.city?.toLowerCase().replace(/\s+/g, "-");
    if (exact && pool.find((c) => c.slug === exact)) return exact;

    return nearestCity(data.latitude, data.longitude, pool);
  } catch {
    return null;
  }
}