// src/app/account/layout.tsx
"use client";

import Navbar from "@/components/Navbar";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        citySlug="toronto"
        cityName="Toronto"
        activeCategory="all"
        onCategoryChange={() => {}}
        onCityChange={(slug) => router.push(`/${slug}`)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}
