"use client";

import { AppRouter } from "@/server/routers/root";
import { inferRouterOutputs } from "@trpc/server";
import EventCard from "./EventCard";
import { ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RouterOutput = inferRouterOutputs<AppRouter>;
type Event = RouterOutput["events"]["getByCity"][number];

interface EventSectionProps {
  title: string;
  events: Event[];
  category: { id: string; label: string; icon: string | null };
  cityName: string;
  citySlug: string;
  icon?: string;
}

export default function EventSection({
  title,
  events,
  category,
  cityName,
  citySlug,
  icon,
}: EventSectionProps) {
  if (events.length === 0) return null;

  const sortedEvents = [...events].sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));

  return (
    <section className="py-8">
      <div className="flex items-end justify-between mb-8 px-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-500">
            <span className="text-2xl">{icon || category.icon}</span>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400">
              {category.label}
            </span>
          </div>
          <h2 className="text-3xl font-bold text-stone-900 tracking-tight font-sora">
            {title} <span className="text-stone-300 font-light">in</span> {cityName}
          </h2>
        </div>
        
        <Button 
          variant="ghost" 
          className="hidden sm:flex rounded-full text-stone-500 hover:text-stone-900 hover:bg-stone-100 font-bold group"
        >
          View all
          <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>

      {/* Responsive horizontal scroll with snap alignment */}
      <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-8 px-2 snap-x snap-mandatory">
        {sortedEvents.map((event) => (
          <div 
            key={event.id} 
            className="shrink-0 snap-start w-[85vw] sm:w-[45vw] lg:w-[22vw]"
          >
            <EventCard event={event} citySlug={citySlug} />
          </div>
        ))}
        
        {/* View All Card at the end */}
        <div className="shrink-0 snap-start w-[40vw] sm:w-[20vw] lg:w-[10vw] flex items-center justify-center">
          <button className="group flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center group-hover:bg-stone-900 group-hover:text-amber-400 transition-all duration-300">
              <ChevronRight className="w-8 h-8" />
            </div>
            <span className="text-sm font-bold text-stone-400 group-hover:text-stone-900 transition-colors">
              View All
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
