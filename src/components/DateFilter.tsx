"use client";

import { Calendar, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type DateFilterType = "all" | "today" | "tomorrow" | "weekend" | "week";

interface DateFilterProps {
  activeFilter: DateFilterType;
  onFilterChange: (filter: DateFilterType) => void;
}

interface DateFilterItem {
  id: DateFilterType;
  label: string;
  sublabel: string;
}

function getDateLabel(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

function getWeekendLabel(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysToSat = (6 - dayOfWeek + 7) % 7;
  const sat = new Date(now);
  sat.setDate(now.getDate() + daysToSat);
  const sun = new Date(sat);
  sun.setDate(sat.getDate() + 1);
  const satStr = sat.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
  const sunStr = sun.toLocaleDateString("en-CA", { day: "numeric" });
  return `${satStr} - ${sunStr}`;
}

function getWeekLabel(): string {
  const now = new Date();
  const end = new Date(now);
  end.setDate(now.getDate() + 7);
  const startStr = now.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
  const endStr = end.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
  return `${startStr} - ${endStr}`;
}

const DATE_FILTERS: DateFilterItem[] = [
  { id: "all", label: "All", sublabel: "Events" },
  { id: "today", label: "Today", sublabel: getDateLabel(0) },
  { id: "tomorrow", label: "Tomorrow", sublabel: getDateLabel(1) },
  { id: "weekend", label: "This Weekend", sublabel: getWeekendLabel() },
  { id: "week", label: "This Week", sublabel: getWeekLabel() },
];

export default function DateFilter({ activeFilter, onFilterChange }: DateFilterProps) {
  return (
    <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
      <div className="flex items-center gap-2 shrink-0 px-2">
        <Calendar className="w-5 h-5 text-amber-500" />
        <span className="text-sm font-bold text-stone-900 uppercase tracking-widest font-sora">When</span>
      </div>
      
      <div className="flex gap-3">
        {DATE_FILTERS.map((filter) => {
          const isActive = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={cn(
                "flex flex-col items-start px-6 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-300 snap-start border",
                isActive
                  ? "bg-stone-900 text-white border-stone-900 shadow-lg shadow-stone-200 scale-105"
                  : "bg-white border-stone-100 text-stone-600 hover:border-amber-200 hover:bg-stone-50"
              )}
            >
              <span className="font-bold tracking-tight">{filter.label}</span>
              <span className={cn(
                "text-[10px] uppercase tracking-widest font-bold mt-0.5",
                isActive ? "text-amber-400" : "text-stone-400"
              )}>
                {filter.sublabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
