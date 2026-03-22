"use client";

import Link from "next/link";
import { Calendar, MapPin } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

interface SimilarEventsProps {
  eventId: string;
  category: string;
  citySlug: string;
}

export default function SimilarEvents({ eventId, category, citySlug }: SimilarEventsProps) {
  const { data: similarEvents, isLoading } = trpc.events.getSimilar.useQuery({
    eventId,
    category,
    citySlug,
    limit: 3,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!similarEvents || similarEvents.length === 0) return null;

  return (
    <div className="mt-12 pt-12 border-t border-gray-200">
      <h2 className="text-2xl font-bold text-indigo-900 mb-6" style={{ fontFamily: "'Sora', sans-serif" }}>
        Similar Events
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {similarEvents.map((event: any) => (
          <Link key={event.id} href={`/${event.citySlug}/${event.slug}`}>
            <div className="bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
              <div className="h-40 bg-gradient-to-br from-indigo-100 to-amber-50 flex items-center justify-center overflow-hidden">
                {event.image ? (
                  <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                ) : (
                  <Calendar className="w-12 h-12 text-indigo-300" />
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-indigo-900 mb-2 line-clamp-2">{event.title}</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-500" />
                    <span>{event.venue}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="inline-block px-2 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded">
                    {event.category}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
