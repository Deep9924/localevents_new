// Design: Civic Warmth — Horizontal scrollable category icons with warm amber active state
import { CATEGORIES } from "@/lib/events-data";

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
  return (
    <section className="py-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2
          className="text-base font-bold text-indigo-900 mb-3"
          style={{ fontFamily: "'Sora', sans-serif" }}
        >
          {cityName}'s Scene
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`flex flex-col items-center gap-1.5 shrink-0 group transition-all duration-200 ${
                activeCategory === cat.id ? "opacity-100" : "opacity-70 hover:opacity-100"
              }`}
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-200 shadow-sm ${
                  activeCategory === cat.id
                    ? "bg-amber-500 shadow-amber-200 shadow-md scale-105"
                    : "bg-indigo-50 group-hover:bg-indigo-100"
                }`}
              >
                {cat.icon}
              </div>
              <span
                className={`text-xs font-medium whitespace-nowrap ${
                  activeCategory === cat.id ? "text-amber-600" : "text-gray-600"
                }`}
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
