"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import HeroBanner from "@/components/HeroBanner";
import CategoryScroll from "@/components/CategoryScroll";
import FeaturedEvent from "@/components/FeaturedEvent";
import EventSection from "@/components/EventSection";
import DateFilter, { DateFilterType } from "@/components/DateFilter";
import MapSection from "@/components/MapSection";
import CommunityBanner from "@/components/CommunityBanner";
import Footer from "@/components/Footer";
import { useLocation } from "@/hooks/useLocation";
import { CITIES, CATEGORIES } from "@/lib/events-data";
import LocationDetectBanner from "@/components/LocationDetectBanner";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

interface CityPageProps {
  citySlug?: string;
}

export default function CityPage({ citySlug }: CityPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { city, citySlug: detectedSlug, isDetecting, detectLocation, permissionDenied } = useLocation(citySlug);

  // Read initial values from URL params
  const [activeCategory, setActiveCategory] = useState<string>(
    searchParams.get("category") ?? "all"
  );
  const [dateFilter, setDateFilter] = useState<DateFilterType>(
    (searchParams.get("date") as DateFilterType) ?? "all"
  );
  const [searchQuery, setSearchQuery] = useState<string>(
    searchParams.get("search") ?? ""
  );

  useEffect(() => {
    if (!citySlug && detectedSlug && !isDetecting) {
      router.replace(`/${detectedSlug}`);
    }
  }, [citySlug, detectedSlug, isDetecting, router]);

  // Sync state changes back to URL
  const updateURL = (newSearch: string, newCategory: string, newDate: string) => {
    const params = new URLSearchParams();
    if (newSearch) params.set("search", newSearch);
    if (newCategory !== "all") params.set("category", newCategory);
    if (newDate !== "all") params.set("date", newDate);
    const query = params.toString();
    router.replace(`/${effectiveSlug}${query ? `?${query}` : ""}`, { scroll: false });
  };

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    updateURL(searchQuery, cat, dateFilter);
  };

  const handleDateChange = (date: DateFilterType) => {
    setDateFilter(date);
    updateURL(searchQuery, activeCategory, date);
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
  };

  const effectiveSlug = citySlug || detectedSlug || "toronto";
  const effectiveCity = city || CITIES.find((c) => c.slug === effectiveSlug) || CITIES[0];

  const { data: allEvents = [], isLoading } = trpc.events.getByCity.useQuery(
    { citySlug: effectiveSlug },
    { enabled: !!effectiveSlug }
  );

  const { data: featuredEvents = [] } = trpc.events.getFeatured.useQuery(
    { citySlug: effectiveSlug },
    { enabled: !!effectiveSlug }
  );

  // Filter events by search + date
  const filteredEvents = useMemo(() => {
    let events = allEvents;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      events = events.filter((e) =>
        e.title.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        (e.description?.toLowerCase().includes(q) ?? false)
      );
    }

    if (dateFilter !== "all") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      events = events.filter((e) => {
        const eventDate = new Date(e.date);
        eventDate.setHours(0, 0, 0, 0);
        const diffDays = Math.round((eventDate.getTime() - today.getTime()) / 86400000);
        const dow = eventDate.getDay();
        if (dateFilter === "today") return diffDays === 0;
        if (dateFilter === "tomorrow") return diffDays === 1;
        if (dateFilter === "weekend") return diffDays >= 0 && diffDays <= 7 && (dow === 0 || dow === 6);
        if (dateFilter === "week") return diffDays >= 0 && diffDays <= 7;
        return true;
      });
    }

    return events;
  }, [allEvents, searchQuery, dateFilter]);

  // Group filtered events by category
  const eventsByCategory = useMemo(() => {
    const grouped: Record<string, typeof allEvents> = {};
    CATEGORIES.forEach((cat) => {
      grouped[cat.id] = filteredEvents.filter((e) => e.category === cat.id);
    });
    return grouped;
  }, [filteredEvents]);

  // Which categories to show — filtered by activeCategory
  const categoriesToShow = activeCategory === "all"
    ? CATEGORIES
    : CATEGORIES.filter((c) => c.id === activeCategory);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {permissionDenied && (
        <LocationDetectBanner onDetect={detectLocation} permissionDenied={permissionDenied} />
      )}

      {featuredEvents.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <FeaturedEvent event={featuredEvents[0]} events={featuredEvents} citySlug={effectiveSlug} />
        </section>
      )}

      <HeroBanner
        cityName={effectiveCity.name}
        province={effectiveCity.province}
        country={effectiveCity.country}
        isDetecting={isDetecting}
        onDetectLocation={detectLocation}
      />

      <CategoryScroll
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        cityName={effectiveCity.name}
      />

      {/* Date filter — moved here, pills style */}
      <DateFilter activeFilter={dateFilter} onFilterChange={handleDateChange} />

      {/* Search results summary */}
      {(searchQuery || activeCategory !== "all" || dateFilter !== "all") && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-1 flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500">
            Showing <span className="font-semibold text-indigo-700">{filteredEvents.length}</span> events
            {searchQuery && <> for <span className="font-semibold">"{searchQuery}"</span></>}
          </span>
          {(searchQuery || activeCategory !== "all" || dateFilter !== "all") && (
            <button
              onClick={() => { setSearchQuery(""); setActiveCategory("all"); setDateFilter("all"); router.replace(`/${effectiveSlug}`, { scroll: false }); }}
              className="text-xs text-red-500 hover:text-red-700 underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-10">
        {categoriesToShow.map((category) => {
          const categoryEvents = eventsByCategory[category.id] || [];
          if (categoryEvents.length === 0) return null;
          return (
            <EventSection
              key={category.id}
              title={category.label}
              category={category as any}
              events={categoryEvents}
              cityName={effectiveCity.name}
              citySlug={effectiveSlug}
            />
          );
        })}
        {filteredEvents.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-2xl mb-2">🎟️</p>
            <p className="text-gray-500 font-medium">No events found</p>
            <p className="text-sm text-gray-400 mt-1">Try a different search or clear your filters</p>
          </div>
        )}
      </div>

      <MapSection city={effectiveCity} events={allEvents} />
      <CommunityBanner />
      <Footer />
    </div>
  );
}
