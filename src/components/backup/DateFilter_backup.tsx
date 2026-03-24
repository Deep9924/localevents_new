// Design: Civic Warmth — Date filter tabs with amber active state
import { Calendar } from "lucide-react";

export type DateFilterType = "all" | "today" | "tomorrow" | "weekend" | "week";

interface DateFilterProps {
  activeFilter: DateFilterType;
  onFilterChange: (filter: DateFilterType) => void;
}

const DATE_FILTERS: { id: DateFilterType; label: string; sublabel: string }[] = [
  { id: "all", label: "All", sublabel: "Events" },
  { id: "today", label: "Today", sublabel: getDateLabel(0) },
  { id: "tomorrow", label: "Tomorrow", sublabel: getDateLabel(1) },
  { id: "weekend", label: "This Weekend", sublabel: getWeekendLabel() },
  { id: "week", label: "This Week", sublabel: getWeekLabel() },
];

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

export default function DateFilter({ activeFilter, onFilterChange }: DateFilterProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide max-w-7xl mx-auto px-4 sm:px-6">
      <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
      {DATE_FILTERS.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={`flex flex-col items-center px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 shrink-0 ${
            activeFilter === filter.id
              ? "bg-indigo-700 text-white shadow-sm"
              : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-700"
          }`}
        >
          <span className="font-semibold">{filter.label}</span>
          <span className={`text-xs ${activeFilter === filter.id ? "text-indigo-200" : "text-gray-400"}`}>
            {filter.sublabel}
          </span>
        </button>
      ))}
    </div>
  );
}
