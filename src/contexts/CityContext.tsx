"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { trpc } from "@/lib/trpc";
import { City } from "@/types/trpc";
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
  const { data: cities = [] } = trpc.events.getCities.useQuery();

  // Sync city from URL on every navigation
  useEffect(() => {
    const segments = pathname.split("/").filter(Boolean);
    const slug = segments[0];
    if (slug && cities.find((c: City) => c.slug === slug)) {
      setCitySlugState(slug);
    }
  }, [pathname, cities]);

  const setCitySlug = (slug: string) => {
    setCitySlugState(slug);
  };

  const cityName = cities.find((c: City) => c.slug === citySlug)?.name ?? "Toronto";

  return (
    <CityContext.Provider value={{ citySlug, cityName, setCitySlug }}>
      {children}
    </CityContext.Provider>
  );
}

export const useCity = () => useContext(CityContext);
