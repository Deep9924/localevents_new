"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useState } from "react";

export default function RootNavbar() {
  const pathname = usePathname();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

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
