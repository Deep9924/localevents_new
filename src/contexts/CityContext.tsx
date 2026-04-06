"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

function slugToName(slug: string) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

interface CityContextType {
  citySlug: string | null;
  cityName: string;
  setCitySlug: (slug: string) => void;
}

const CityContext = createContext<CityContextType>({
  citySlug:    null,
  cityName:    "",
  setCitySlug: () => {},
});

export function CityProvider({
  initialCity = null,
  children,
}: {
  initialCity?: string | null;
  children: ReactNode;
}) {
  const [citySlug, setCitySlugState] = useState<string | null>(initialCity);
  const router   = useRouter();
  const pathname = usePathname();

  // First-time visitor with no detected city — send to /cities picker
  useEffect(() => {
    if (!citySlug && pathname !== "/cities") {
      router.replace("/cities");
    }
  }, [citySlug, pathname]);

  const setCitySlug = (slug: string) => {
    setCitySlugState(slug);
    document.cookie = `city=${slug}; path=/; max-age=${60 * 60 * 24 * 365}`;
  };

  return (
    <CityContext.Provider value={{
      citySlug,
      cityName:    citySlug ? slugToName(citySlug) : "",
      setCitySlug,
    }}>
      {children}
    </CityContext.Provider>
  );
}

export const useCity = () => useContext(CityContext);