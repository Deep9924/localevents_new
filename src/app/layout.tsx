import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import RootNavbar from "@/components/RootNavbar";
import { CityProvider } from "@/contexts/CityContext";
import { createContext } from "@/server/context";
import { headers, cookies } from "next/headers";
import { detectCityFromIp } from "@/lib/detectCity";
import { getDb } from "@/server/db/index";
import { cities as citiesTable } from "@/server/db/schema";

const sora = Sora({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LocalEvents",
  description: "Discover local events in your city",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [ctx, headersList, cookieStore, db] = await Promise.all([
    createContext(),
    headers(),
    cookies(),
    getDb(),
  ]);

  const dbCities = db
  ? await db
      .select({
        slug: citiesTable.slug,
        lat:  citiesTable.lat,
        lng:  citiesTable.lng,
      })
      .from(citiesTable)
  : [];

  const knownSlugs     = new Set(dbCities.map((c) => c.slug));
  const pathname       = headersList.get("x-pathname") ?? "";
  const cityFromUrl    = pathname.split("/").filter(Boolean)[0];
  const cityFromCookie = cookieStore.get("city")?.value;

  let initialCity: string | null = null;

  if (cityFromUrl && knownSlugs.has(cityFromUrl)) {
    // 1. URL slug — user is already on a city page
    initialCity = cityFromUrl;
  } else if (cityFromCookie && knownSlugs.has(cityFromCookie)) {
    // 2. Returning visitor — use their saved city
    initialCity = cityFromCookie;
  } else {
    // 3. First-time visitor — try IP detection
    const ip = headersList.get("x-client-ip") ?? "unknown";
    initialCity = await detectCityFromIp(ip, dbCities);
    // null means unknown — CityProvider will send them to /cities
  }

  return (
    <html lang="en">
      <body className={sora.className}>
        <Providers>
          <CityProvider initialCity={initialCity}>
            <RootNavbar initialUser={ctx.user} />
            {children}
            <Toaster richColors position="top-right" />
          </CityProvider>
        </Providers>
      </body>
    </html>
  );
}