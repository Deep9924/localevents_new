"use client";

import Link from "next/link";
import { Mail, Phone, Globe, Calendar, MapPin } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

interface OrganizerProfileProps {
  organizerId: number;
}

export default function OrganizerProfile({ organizerId }: OrganizerProfileProps) {
  const { data: organizer, isLoading: organizerLoading } = trpc.organizers.getById.useQuery({ organizerId });
  const { data: organizerEvents, isLoading: eventsLoading } = trpc.organizers.getEvents.useQuery({ organizerId, limit: 4 });

  if (organizerLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>;
  }
  if (!organizer) return null;

  return (
    <div className="mt-12 pt-12 border-t border-gray-200">
      <div className="bg-gradient-to-r from-indigo-50 to-amber-50 rounded-lg p-8 mb-8">
        <div className="flex items-start gap-6">
          {organizer.image ? (
            <img src={organizer.image} alt={organizer.name} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-indigo-200 flex items-center justify-center border-4 border-white shadow-lg">
              <span className="text-2xl font-bold text-indigo-700">{organizer.name.charAt(0)}</span>
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-bold text-indigo-900">{organizer.name}</h2>
              {organizer.verified === 1 && (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Verified</span>
              )}
            </div>
            {organizer.description && <p className="text-gray-700 mb-4">{organizer.description}</p>}
            <div className="flex flex-wrap gap-4">
              {organizer.email && (
                <a href={`mailto:${organizer.email}`} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700">
                  <Mail className="w-4 h-4" /><span className="text-sm">{organizer.email}</span>
                </a>
              )}
              {organizer.phone && (
                <a href={`tel:${organizer.phone}`} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700">
                  <Phone className="w-4 h-4" /><span className="text-sm">{organizer.phone}</span>
                </a>
              )}
              {organizer.website && (
                <a href={organizer.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700">
                  <Globe className="w-4 h-4" /><span className="text-sm">Website</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Organizer's Other Events */}
      {eventsLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
      ) : organizerEvents && organizerEvents.length > 0 ? (
        <div>
          <h3 className="text-xl font-bold text-indigo-900 mb-6">More Events by {organizer.name}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {organizerEvents.map((event: any) => (
              <Link key={event.id} href={`/${event.citySlug}/${event.slug}`}>
                <div className="bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="h-32 bg-gradient-to-br from-indigo-100 to-amber-50 flex items-center justify-center overflow-hidden">
                    {event.image ? (
                      <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                    ) : (
                      <Calendar className="w-10 h-10 text-indigo-300" />
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-indigo-900 mb-2 line-clamp-2">{event.title}</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-amber-500" /><span>{event.date}</span></div>
                      <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-amber-500" /><span className="line-clamp-1">{event.venue}</span></div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
