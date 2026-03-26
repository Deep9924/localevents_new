// src/components/RootNavbar.tsx
"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function RootNavbar() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();

  // Hide navbar on any /search route (e.g. /london/search)
  if (pathname?.endsWith("/search")) return null;

  return (
    <Navbar
      activeCategory={activeCategory}
      onCategoryChange={setActiveCategory}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    />
  );
}
