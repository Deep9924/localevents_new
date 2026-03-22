// src/components/RootNavbar.tsx
"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";

export default function RootNavbar() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <Navbar
      activeCategory={activeCategory}
      onCategoryChange={setActiveCategory}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    />
  );
}
