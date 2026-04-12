"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Users, Bookmark, BookmarkCheck, Star } from "lucide-react";
import Image from "next/image";
import { trpc } from "@/lib/trpc";
import { AppRouter } from "@/server/routers/root";
import { inferRouterOutputs } from "@trpc/server";
import { useBookmark } from "@/hooks/useBookmark";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type RouterOutput = inferRouterOutputs<AppRouter>;
type Event = RouterOutput["events"]["getByCity"][number];

interface EventCardProps {
  event: Event;
  citySlug?: string;
  onBookmarkToggle?: (isSaved: boolean) => void;
  hideBookmark?: boolean;
  className?: string;
}

export default function EventCard({ 
  event, 
  citySlug = "toronto",
  onBookmarkToggle,
  hideBookmark = false,
  className
}: EventCardProps) {
  const router = useRouter();
  const [imgError, setImgError] = useState(false);
  const { isSaved, handleBookmarkToggle } = useBookmark(event);

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await handleBookmarkToggle();
    onBookmarkToggle?.(isSaved);
  };

  const handleCardClick = () => {
    router.push(`/${citySlug}/${event.slug}`);
  };

  return (
    <div 
      onClick={handleCardClick} 
      className={cn(
        "group cursor-pointer flex flex-col bg-white rounded-3xl overflow-hidden border border-stone-100 transition-all hover:shadow-2xl hover:shadow-stone-200/50 hover:-translate-y-1",
        className
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
        {!imgError && event.image ? (
          <Image
            src={event.image}
            alt={event.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-stone-100 to-amber-50/30 flex items-center justify-center">
            <Calendar className="w-12 h-12 text-stone-300" />
          </div>
        )}
        
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {event.isFeatured && (
          <Badge className="absolute top-3 left-3 bg-amber-400 text-stone-950 border-none font-bold shadow-lg">
            <Star className="w-3 h-3 mr-1 fill-current" /> Featured
          </Badge>
        )}

        {!hideBookmark && (
          <button
            onClick={handleBookmark}
            className="absolute top-3 right-3 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg hover:bg-white hover:scale-110 transition-all active:scale-90"
          >
            {isSaved
              ? <BookmarkCheck className="w-5 h-5 text-amber-600 fill-amber-600" />
              : <Bookmark className="w-5 h-5 text-stone-600" />}
          </button>
        )}

        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <span className="text-white text-xs font-bold px-2 py-1 rounded-md bg-stone-900/40 backdrop-blur-sm">
            {event.category}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-amber-600 text-xs font-bold uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>{event.date}</span>
          </div>
          <span className={cn(
            "text-xs font-bold px-2 py-0.5 rounded-full",
            event.price === "Free" || event.price === null 
              ? "bg-emerald-50 text-emerald-700" 
              : "bg-stone-50 text-stone-600"
          )}>
            {event.price === "Free" || event.price === null ? "FREE" : event.price}
          </span>
        </div>
        
        <h3 className="font-bold text-stone-900 group-hover:text-amber-600 transition-colors line-clamp-2 text-lg leading-tight font-sora">
          {event.title}
        </h3>
        
        <div className="flex items-center gap-1.5 text-stone-500 text-sm">
          <MapPin className="w-4 h-4 shrink-0 text-stone-400" />
          <span className="line-clamp-1">{event.venue}</span>
        </div>
        
        <div className="flex items-center justify-between mt-2 pt-3 border-t border-stone-50">
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-stone-200 overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-stone-300 to-stone-400" />
                </div>
              ))}
            </div>
            <span className="text-xs text-stone-500 font-medium">
              {event.interested ? `+${event.interested} attending` : 'Be the first to join'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
