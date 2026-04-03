"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Users, Bookmark, BookmarkCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { AppRouter } from "@/server/routers/root";
import { inferRouterOutputs } from "@trpc/server";
import { useBookmark } from "@/hooks/useBookmark";
import { toast } from "sonner";

type RouterOutput = inferRouterOutputs<AppRouter>;
type Event = RouterOutput["events"]["getByCity"][number];

interface EventCardProps {
  event: Event;
  citySlug?: string;
  onBookmarkToggle?: (isSaved: boolean) => void;
  hideBookmark?: boolean;
}

export default function EventCard({ 
  event, 
  citySlug = "toronto",
  onBookmarkToggle,
  hideBookmark = false
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
    <div onClick={handleCardClick} className="group cursor-pointer flex flex-col">
      <div className="relative overflow-hidden rounded-2xl bg-gray-100" style={{ aspectRatio: "16/9" }}>
        {!imgError && event.image ? (
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-amber-50 flex items-center justify-center">
            <Calendar className="w-12 h-12 text-indigo-300" />
          </div>
        )}
        
        {event.isFeatured && (
          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-100">
            <span className="text-amber-400">★</span> Featured
          </span>
        )}

        {!hideBookmark && (
          <button
            onClick={handleBookmark}
            className="absolute top-2.5 right-2.5 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
          >
            {isSaved
              ? <BookmarkCheck className="w-4 h-4 text-indigo-600" />
              : <Bookmark className="w-4 h-4 text-gray-400" />}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1 pt-3 px-0.5">
        <div className="flex items-center gap-1.5 text-amber-600 text-xs font-semibold font-sora">
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span>{event.date} • {event.time}</span>
        </div>
        
        <h3 className="font-bold text-gray-900 group-hover:text-indigo-700 transition-colors line-clamp-2 text-sm leading-snug font-sora">
          {event.title}
        </h3>
        
        <div className="flex items-center gap-1 text-gray-500 text-xs">
          <MapPin className="w-3 h-3 shrink-0 text-gray-400" />
          <span className="line-clamp-1">{event.venue}</span>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-gray-600 mt-0.5">
          {(event.interested ?? 0) > 0 && (
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-indigo-400" />
              <span className="font-semibold text-indigo-600">{event.interested}</span>
              <span>Interested</span>
            </div>
          )}
          
          <span className="text-gray-300">•</span>
          
          {event.price === "Free" || event.price === null
            ? <span className="text-green-600 font-semibold">Free</span>
            : <span className="text-gray-600">{event.price}</span>
          }
        </div>
      </div>
    </div>
  );
}
