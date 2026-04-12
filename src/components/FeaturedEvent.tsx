"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Ticket, ChevronLeft, ChevronRight, Bookmark, Sparkles, Star } from "lucide-react";
import Image from "next/image";
import { trpc } from "@/lib/trpc";
import { AppRouter } from "@/server/routers/root";
import { inferRouterOutputs } from "@trpc/server";
import { useBookmark } from "@/hooks/useBookmark";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type RouterOutput = inferRouterOutputs<AppRouter>;
type Event = RouterOutput["events"]["getByCity"][number];

interface FeaturedEventProps {
  event: Event;
  events?: Event[];
  citySlug: string;
}

export default function FeaturedEvent({ event, events, citySlug }: FeaturedEventProps) {
  const allEvents = events?.length ? events : [event];
  const [current, setCurrent] = useState(0);
  const active = allEvents[current];
  const router = useRouter();
  const { isSaved, handleBookmarkToggle } = useBookmark(active);

  const goNext = () => setCurrent((prev) => (prev + 1) % allEvents.length);
  const goPrev = () => setCurrent((prev) => (prev - 1 + allEvents.length) % allEvents.length);

  return (
    <div className="relative group">
      <div 
        className="relative w-full aspect-[21/9] min-h-[400px] rounded-[3rem] overflow-hidden bg-stone-900 shadow-2xl shadow-stone-200/50 cursor-pointer"
        onClick={() => router.push(`/${citySlug}/${active.slug}`)}
      >
        {/* Background Image with Zoom Effect */}
        <div className="absolute inset-0">
          <Image
            src={active.image || ""}
            alt={active.title}
            fill
            priority
            className="object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent" />
        </div>

        {/* Content Overlay */}
        <div className="relative h-full flex flex-col justify-center px-8 sm:px-16 lg:px-24 max-w-4xl space-y-6">
          <div className="flex items-center gap-3">
            <Badge className="bg-amber-400 text-stone-950 border-none font-bold px-4 py-1 shadow-lg">
              <Star className="w-4 h-4 mr-2 fill-current" /> EDITOR'S CHOICE
            </Badge>
            <div className="flex items-center gap-2 text-white/60 text-sm font-bold uppercase tracking-widest">
              <Calendar className="w-4 h-4 text-amber-400" />
              {active.date}
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight font-sora">
            {active.title}
          </h1>

          <p className="text-stone-300 text-lg sm:text-xl font-light leading-relaxed max-w-2xl line-clamp-2">
            {active.description || `Join us for an unforgettable experience in ${active.city}. Don't miss out on one of the most anticipated events of the season.`}
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <Button
              size="lg"
              className="rounded-full bg-white hover:bg-stone-100 text-stone-950 font-bold px-10 py-7 text-lg shadow-xl transition-all hover:scale-105 active:scale-95"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/${citySlug}/${active.slug}`);
              }}
            >
              Get Tickets
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="rounded-full border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold px-10 py-7 text-lg backdrop-blur-md transition-all hover:scale-105 active:scale-95"
              onClick={(e) => {
                e.stopPropagation();
                handleBookmarkToggle();
              }}
            >
              {isSaved ? <Bookmark className="mr-2 h-6 w-6 fill-white" /> : <Bookmark className="mr-2 h-6 w-6" />}
              {isSaved ? "Saved" : "Save for later"}
            </Button>
          </div>
        </div>

        {/* Navigation Controls */}
        {allEvents.length > 1 && (
          <div className="absolute bottom-8 right-8 sm:right-16 flex items-center gap-4">
            <div className="flex gap-2 mr-4">
              {allEvents.map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-500",
                    i === current ? "w-8 bg-amber-400" : "w-2 bg-white/20"
                  )}
                />
              ))}
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md flex items-center justify-center text-white transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md flex items-center justify-center text-white transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
