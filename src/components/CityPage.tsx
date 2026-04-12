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
import { Loader2, Sparkles, FilterX } from "lucide-react";
import { City, Category, Event } from "@/types/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

  if (!effectiveSlug || (isDetecting && !citySlug)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-stone-900 flex items-center justify-center animate-pulse">
              <Sparkles className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <p className="text-stone-500 font-medium animate-pulse">Finding events near you...</p>
        </div>
      </div>
    );
  }

  if (citiesLoading || eventsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
          <p className="text-stone-600 font-medium">Loading events in {effectiveCity?.name}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50/30">
      {permissionDenied && (
        <LocationDetectBanner onDetect={detectLocation} permissionDenied={permissionDenied} />
      )}

      <HeroBanner citySlug={effectiveSlug} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-stone-200/40 p-2 sm:p-4 border border-stone-100">
          <CategoryScroll
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
            cityName={effectiveCity.name}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <DateFilter activeFilter={dateFilter} onFilterChange={handleDateChange} />
          
          {(searchQuery || activeCategory !== "all" || dateFilter !== "all") && (
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-stone-100 shadow-sm">
              <Badge variant="secondary" className="bg-stone-100 text-stone-600 border-none px-3 py-1">
                {filteredEvents.length} results
              </Badge>
              {searchQuery && (
                <span className="text-sm text-stone-500 font-medium">
                  for <span className="text-stone-900">"{searchQuery}"</span>
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl h-8 px-3"
              >
                <FilterX className="w-4 h-4 mr-2" /> Clear
              </Button>
            </div>
          )}
        </div>

        {featuredEvents.length > 0 && activeCategory === "all" && (
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-2xl font-bold text-stone-900">Featured in {effectiveCity.name}</h2>
            </div>
            <FeaturedEvent
              event={featuredEvents[0]}
              events={featuredEvents}
              citySlug={effectiveSlug}
            />
          </div>
        )}

        <div className="space-y-16">
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
            <div className="py-24 text-center bg-white rounded-[3rem] border border-stone-100 shadow-sm">
              <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <FilterX className="w-10 h-10 text-stone-300" />
              </div>
              <h3 className="text-2xl font-bold text-stone-900 mb-2">No events found</h3>
              <p className="text-stone-500 max-w-xs mx-auto mb-8">
                We couldn't find any events matching your current filters. Try adjusting them to see more results.
              </p>
              <Button 
                onClick={clearFilters}
                className="rounded-full bg-stone-900 hover:bg-stone-800 px-8"
              >
                Reset all filters
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-16">
        <MapSection city={effectiveCity} events={filteredEvents} />
      </div>
      
      <CommunityBanner />
      <Footer />
    </div>
  );
}
