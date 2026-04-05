"use client";

import { useRouter } from "next/navigation";
import { useMemo, useEffect } from "react";
import HeroBanner from "@/components/HeroBanner";
import CategoryScroll from "@/components/CategoryScroll";
import FeaturedEvent from "@/components/FeaturedEvent";
import EventSection from "@/components/EventSection";
import DateFilter from "@/components/DateFilter";
import MapSection from "@/components/MapSection";
import CommunityBanner from "@/components/CommunityBanner";
import Footer from "@/components/Footer";
import { useLocation } from "@/hooks/useLocation";
import { useEventFilters } from "@/hooks/useEventFilters";
import LocationDetectBanner from "@/components/LocationDetectBanner";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { City, Category, Event } from "@/types/trpc";

interface CityPageProps {
  citySlug?: string;
}

export default function CityPage({ citySlug }: CityPageProps) {
  const {
    city,
    citySlug: detectedSlug,
    isDetecting,
    detectLocation,
    permissionDenied,
  } = useLocation(citySlug);

  const router = useRouter();

  // If we have an explicit citySlug from the URL, use it immediately.
  // If not, wait for detection to finish. If detection finishes with nothing,
  // redirect to the cities landing page instead of defaulting to Toronto.
  const effectiveSlug = citySlug || (!isDetecting ? detectedSlug || null : null);

  useEffect(() => {
    if (!citySlug && !isDetecting && !detectedSlug) {
      router.replace("/");
    }
  }, [citySlug, isDetecting, detectedSlug, router]);

  const {
    activeCategory,
    dateFilter,
    searchQuery,
    handleCategoryChange,
    handleDateChange,
    handleSearchChange,
    clearFilters,
  } = useEventFilters(effectiveSlug ?? "");

  const { data: cities = [], isLoading: citiesLoading } = trpc.events.getCities.useQuery();
  const { data: categories = [] } = trpc.events.getCategories.useQuery();

  const effectiveCity =
    city ||
    (effectiveSlug ? cities.find((c: City) => c.slug === effectiveSlug) : undefined) ||
    cities[0];

  const { data: filteredEvents = [], isLoading: eventsLoading } =
    trpc.events.getByCity.useQuery(
      {
        citySlug: effectiveSlug ?? "",
        category: activeCategory,
        date: dateFilter,
        search: searchQuery,
      },
      { enabled: !!effectiveSlug }
    );

  const { data: featuredEvents = [] } = trpc.events.getFeatured.useQuery(
    { citySlug: effectiveSlug ?? "" },
    { enabled: !!effectiveSlug }
  );

  const eventsByCategory = useMemo(() => {
    const grouped: Record<string, typeof filteredEvents> = {};
    categories.forEach((cat: Category) => {
      grouped[cat.id] = filteredEvents.filter((e: Event) => e.category === cat.id);
    });
    return grouped;
  }, [filteredEvents, categories]);

  const categoriesToShow =
    activeCategory === "all"
      ? categories
      : categories.filter((c: Category) => c.id === activeCategory);

  // Still detecting location on first visit — show a subtle full-screen loader
  // instead of flashing Toronto content
  if (!effectiveSlug || (isDetecting && !citySlug)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-gray-500 text-sm">Finding events near you…</p>
        </div>
      </div>
    );
  }

  if (citiesLoading || eventsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-gray-600 text-sm">Loading events…</p>
        </div>
      </div>
    );
  }

  if (!effectiveCity) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">City not found.</p>
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
          <FeaturedEvent
            event={featuredEvents[0]}
            events={featuredEvents}
            citySlug={effectiveSlug}
          />
        </section>
      )}

      <HeroBanner
        citySlug={effectiveSlug}
        isDetecting={isDetecting}
        onDetectLocation={detectLocation}
      />

      <CategoryScroll
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        cityName={effectiveCity.name}
      />

      <DateFilter activeFilter={dateFilter} onFilterChange={handleDateChange} />

      {(searchQuery || activeCategory !== "all" || dateFilter !== "all") && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-1 flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-semibold text-indigo-700">{filteredEvents.length}</span> events
            {searchQuery && (
              <>
                {" "}for <span className="font-semibold">"{searchQuery}"</span>
              </>
            )}
          </span>
          <button
            onClick={clearFilters}
            className="text-xs text-red-500 hover:text-red-700 underline"
          >
            Clear filters
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-10">
        {categoriesToShow.map((category: Category) => {
          const categoryEvents = eventsByCategory[category.id] || [];
          if (categoryEvents.length === 0) return null;
          return (
            <EventSection
              key={category.id}
              title={category.label}
              category={category}
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
            <p className="text-sm text-gray-400 mt-1">
              Try a different search or clear your filters
            </p>
          </div>
        )}
      </div>

      <MapSection city={effectiveCity} events={filteredEvents} />
      <CommunityBanner />
      <Footer />
    </div>
  );
}
