"use client";

import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Loader2,
  ArrowLeft,
  Ticket,
  Calendar,
  Clock,
  MapPin,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDate, formatTime } from "@/lib/utils";

export default function AccountTickets() {
  const { user, loading, isAuthenticated } = useAuth({
    redirectOnUnauthenticated: true,
  });
  const router = useRouter();

  const {
    data: tickets = [],
    isLoading,
  } = trpc.tickets.list.useQuery(undefined, {
    enabled: isAuthenticated && !!user,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="border-b border-slate-200 bg-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push("/account/profile")}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors -ml-2"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900">
              Your Tickets
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 truncate">
              {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12">
            <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No tickets yet
            </h3>
            <Button
              onClick={() => router.push("/")}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Browse Events
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {tickets.map((row: any) => {
              const event = {
                id: row.eventId,
                title: row.title,
                city: row.city,
                citySlug: row.citySlug,
                category: row.category,
                venue: row.venue,
                date: row.date,
                time: row.time,
                slug: row.slug,
                image: row.image,
              };

              const isPast =
                new Date(`${event.date}T${event.time || "00:00"}`) <
                new Date();

              return (
                <Card
                  key={row.ticketId}
                  className={`overflow-hidden hover:shadow-lg transition-shadow ${
                    isPast ? "opacity-80" : ""
                  }`}
                >
                  <div className="p-4 flex flex-col sm:flex-row gap-4">
                    {event.image && (
                      <div className="w-full sm:w-32 h-40 sm:h-32 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold text-slate-900 line-clamp-2">
                            {event.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-600 capitalize">
                            {event.city} · {event.category}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded whitespace-nowrap">
                          {row.quantity} ticket
                          {row.quantity !== 1 ? "s" : ""}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs sm:text-sm text-slate-600 mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(event.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(event.time)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{event.venue}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                          Order #{row.ticketId} · {row.currency}{" "}
                          {Number(row.total).toFixed(2)}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          onClick={() =>
                            router.push(`/${event.citySlug}/${event.slug}`)
                          }
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                        >
                          View Event
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                        >
                          View Ticket
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}