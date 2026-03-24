import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DateFilterType } from "@/components/DateFilter";

export function useEventFilters(initialCitySlug: string) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeCategory, setActiveCategory] = useState<string>(
    searchParams.get("category") ?? "all"
  );
  const [dateFilter, setDateFilter] = useState<DateFilterType>(
    (searchParams.get("date") as DateFilterType) ?? "all"
  );
  const [searchQuery, setSearchQuery] = useState<string>(
    searchParams.get("search") ?? ""
  );

  const updateURL = useCallback((newSearch: string, newCategory: string, newDate: string) => {
    const params = new URLSearchParams();
    if (newSearch) params.set("search", newSearch);
    if (newCategory !== "all") params.set("category", newCategory);
    if (newDate !== "all") params.set("date", newDate);
    const query = params.toString();
    router.replace(`/${initialCitySlug}${query ? `?${query}` : ""}`, { scroll: false });
  }, [initialCitySlug, router]);

  const handleCategoryChange = useCallback((cat: string) => {
    setActiveCategory(cat);
    updateURL(searchQuery, cat, dateFilter);
  }, [searchQuery, dateFilter, updateURL]);

  const handleDateChange = useCallback((date: DateFilterType) => {
    setDateFilter(date);
    updateURL(searchQuery, activeCategory, date);
  }, [searchQuery, activeCategory, updateURL]);

  const handleSearchChange = useCallback((q: string) => {
    setSearchQuery(q);
    // Debounce this if needed or update on enter/button click
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setActiveCategory("all");
    setDateFilter("all");
    router.replace(`/${initialCitySlug}`, { scroll: false });
  }, [initialCitySlug, router]);

  return {
    activeCategory,
    dateFilter,
    searchQuery,
    handleCategoryChange,
    handleDateChange,
    handleSearchChange,
    clearFilters,
    updateURL, // Expose if needed for direct calls
  };
}
