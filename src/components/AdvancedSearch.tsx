import { useState } from "react";
import { Search, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

interface SearchFilters {
  query: string;
  minPrice: number | null;
  maxPrice: number | null;
  date: string | null;
  category: string | null;
}

interface AdvancedSearchProps {
  citySlug?: string;
}

export default function AdvancedSearch({ citySlug }: AdvancedSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    minPrice: null,
    maxPrice: null,
    date: null,
    category: null,
  });

  const { data: results, isLoading } = trpc.events.search.useQuery(
    {
      query: filters.query,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      date: filters.date,
      category: filters.category,
      citySlug: citySlug || "",
    },
    { enabled: isOpen && filters.query.length > 0 }
  );

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      query: "",
      minPrice: null,
      maxPrice: null,
      date: null,
      category: null,
    });
  };

  const categories = [
    "Music",
    "Concerts",
    "Parties",
    "Comedy",
    "Performances",
    "Exhibitions",
    "Food & Drinks",
    "Theatre",
    "Wellness",
    "Sports",
    "Kids",
    "Business",
  ];

  return (
    <div className="relative w-full max-w-2xl">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search events by name, venue, or keyword..."
          value={filters.query}
          onChange={(e) => handleFilterChange("query", e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="w-full px-4 py-3 pl-10 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        {filters.query && (
          <button
            onClick={() => handleFilterChange("query", "")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Dropdown Results & Filters */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
          {/* Filter Section */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-indigo-600" />
              <h3 className="font-semibold text-gray-700">Filters</h3>
            </div>

            {/* Price Range */}
            <div className="mb-3">
              <label className="text-sm font-medium text-gray-600 block mb-2">
                Price Range
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice || ""}
                  onChange={(e) =>
                    handleFilterChange("minPrice", e.target.value ? parseInt(e.target.value) : null)
                  }
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice || ""}
                  onChange={(e) =>
                    handleFilterChange("maxPrice", e.target.value ? parseInt(e.target.value) : null)
                  }
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>

            {/* Date Filter */}
            <div className="mb-3">
              <label className="text-sm font-medium text-gray-600 block mb-2">
                Date
              </label>
              <select
                value={filters.date || ""}
                onChange={(e) => handleFilterChange("date", e.target.value || null)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="">Any Date</option>
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="this-weekend">This Weekend</option>
                <option value="this-week">This Week</option>
                <option value="this-month">This Month</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="mb-3">
              <label className="text-sm font-medium text-gray-600 block mb-2">
                Category
              </label>
              <select
                value={filters.category || ""}
                onChange={(e) => handleFilterChange("category", e.target.value || null)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat.toLowerCase()}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            {(filters.minPrice || filters.maxPrice || filters.date || filters.category) && (
              <Button
                onClick={clearFilters}
                variant="outline"
                size="sm"
                className="w-full text-xs"
              >
                Clear Filters
              </Button>
            )}
          </div>

          {/* Results Section */}
          <div className="p-4">
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Searching...</p>
              </div>
            ) : results && results.length > 0 ? (
              <div className="space-y-2">
                {results.map((event: any) => (
                  <Link key={event.id} href={`/${event.citySlug}/${event.slug}`}>
                    <div className="p-3 hover:bg-indigo-50 rounded cursor-pointer transition-colors border-b border-gray-100 last:border-b-0">
                      <h4 className="font-semibold text-indigo-900 text-sm">{event.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {event.date} • {event.venue}
                      </p>
                      <p className="text-xs text-amber-600 font-medium mt-1">
                        {event.price === "Free" ? "Free" : event.price}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : filters.query.length > 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No events found matching your search.</p>
              </div>
            ) : null}
          </div>

          {/* Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
