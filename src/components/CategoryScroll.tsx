"use client";

import { trpc } from "@/lib/trpc";
import { Loader2, Sparkles } from "lucide-react";
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
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <section className="py-4 sm:py-6">
      <div className="flex items-center gap-2 mb-6 px-2">
        <Sparkles className="w-4 h-4 text-amber-500" />
        <h2 className="text-sm font-bold text-stone-900 uppercase tracking-widest font-sora">
          Explore {cityName}
        </h2>
      </div>
      
      <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 px-2 scrollbar-hide snap-x snap-mandatory">
        {categories.map((cat: Category) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={cn(
                "flex flex-col items-center gap-3 shrink-0 group transition-all duration-300 snap-start",
                isActive ? "opacity-100 scale-105" : "opacity-60 hover:opacity-100"
              )}
            >
              <div
                className={cn(
                  "w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] flex items-center justify-center text-3xl transition-all duration-500 shadow-sm",
                  isActive
                    ? "bg-stone-900 text-amber-400 shadow-xl shadow-stone-200 ring-4 ring-amber-400/20"
                    : "bg-stone-50 text-stone-400 group-hover:bg-white group-hover:shadow-md group-hover:text-stone-600"
                )}
              >
                <span className="transition-transform duration-500 group-hover:scale-110">
                  {cat.icon}
                </span>
              </div>
              <span
                className={cn(
                  "text-xs sm:text-sm font-bold whitespace-nowrap transition-colors duration-300",
                  isActive ? "text-stone-900" : "text-stone-500 group-hover:text-stone-700"
                )}
              >
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
