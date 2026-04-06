"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useState } from "react";
import type { User } from "@/server/db/schema";

export default function RootNavbar({ initialUser }: { initialUser?: User | null }) {
  const pathname = usePathname();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery]       = useState("");

  if (pathname?.includes("/search")) return null;

  return (
    <Navbar
      initialUser={initialUser}
      activeCategory={activeCategory}
      onCategoryChange={setActiveCategory}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    />
  );
}