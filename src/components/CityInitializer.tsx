"use client";

import { useEffect } from "react";
import { useCity } from "@/contexts/CityContext";

export function CityInitializer({ city }: { city: string }) {
  const { setCitySlug } = useCity();
  // Runs before first paint on client — sets real city immediately
  useEffect(() => {
    setCitySlug(city);
  }, [city]);
  return null;
}