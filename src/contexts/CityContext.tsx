"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { CITIES } from "@/lib/events-data";
import { usePathname } from "next/navigation";

interface CityContextType {
  citySlug: string;
  cityName: string;
  setCitySlug: (slug: string) => void;
}

const CityContext = createContext<CityContextType>({
  citySlug: "toronto",
  cityName: "Toronto",
  setCitySlug: () => {},
});

export function CityProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [citySlug, setCitySlugState] = useState("toronto");

  // Sync city from URL on every navigation
  useEffect(() => {
    const segments = pathname.split("/").filter(Boolean);
    const slug = segments[0];
    if (slug && CITIES.find((c) => c.slug === slug)) {
      setCitySlugState(slug);
    }
  }, [pathname]);

  const setCitySlug = (slug: string) => {
    setCitySlugState(slug);
  };

  const cityName = CITIES.find((c) => c.slug === citySlug)?.name ?? "Toronto";

  return (
    <CityContext.Provider value={{ citySlug, cityName, setCitySlug }}>
      {children}
    </CityContext.Provider>
  );
}

export const useCity = () => useContext(CityContext);
