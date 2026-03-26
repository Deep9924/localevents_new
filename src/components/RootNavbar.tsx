// src/components/RootNavbar.tsx
"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function RootNavbar() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();

  // Hide the full navbar on any search page
  if (pathname?.includes("/search")) return null;

  return (
    <Navbar
      activeCategory={activeCategory}
      onCategoryChange={setActiveCategory}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    />
  );
}
