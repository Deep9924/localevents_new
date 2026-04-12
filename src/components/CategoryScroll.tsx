"use client";

import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import type { AppRouter } from "@/server/routers/root";
import type { inferRouterOutputs } from "@trpc/server";
import { cn } from "@/lib/utils";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Category = RouterOutputs["events"]["getCategories"][number];

interface CategoryScrollProps {
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
  cityName: string;
}

export default function CategoryScroll({
  activeCategory,
  onCategoryChange,
  cityName,
}: CategoryScrollProps) {
  const { data: categories = [], isLoading } = trpc.events.getCategories.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <section className="py-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="text-base font-bold text-indigo-900 mb-3 font-sora">
          {cityName}'s Scene
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat: Category) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 shrink-0 group transition-all duration-200",
                activeCategory === cat.id ? "opacity-100" : "opacity-70 hover:opacity-100"
              )}
            >
              <div
                className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-200 shadow-sm",
                  activeCategory === cat.id
                    ? "bg-amber-500 shadow-amber-200 shadow-md scale-105"
                    : "bg-indigo-50 group-hover:bg-indigo-100"
                )}
              >
                {cat.icon}
              </div>
              <span
                className={cn(
                  "text-xs font-medium whitespace-nowrap",
                  activeCategory === cat.id ? "text-amber-600" : "text-gray-600"
                )}
              >
                {cat.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
