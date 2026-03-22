// src/components/RootNavbar.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { CITIES } from "@/lib/events-data";

export default function RootNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Extract city slug from URL: /toronto, /toronto/some-event
  const segments = pathname.split("/").filter(Boolean);
  const potentialCity = segments[0];
  const cityExists = CITIES.some((c) => c.slug === potentialCity);
  const citySlug = cityExists ? potentialCity : "toronto";

  return (
    <Navbar
      citySlug={citySlug}
      activeCategory={activeCategory}
      onCategoryChange={setActiveCategory}
      onCityChange={(slug) => router.push(`/${slug}`)}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    />
  );
}