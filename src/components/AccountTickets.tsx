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
  Download,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { formatDate, formatTime } from "@/lib/utils";
import type { AppRouter } from "@/server/routers";
import type { inferRouterOutputs } from "@trpc/server";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type TicketWithEvent = RouterOutputs["tickets"]["list"][number];
type TicketWithNonNullEvent = TicketWithEvent & {
  event: NonNullable<TicketWithEvent["event"]>;
};

type FilterType = "all" | "upcoming" | "past";
type StatusFilter = "all" | "paid" | "refunded" | "pending";

export default function AccountTickets() {
  const { user, loading: authLoading, isAuthenticated } = useAuth({
    redirectOnUnauthenticated: true,
  });
  const router = useRouter();
  const [filterType, setFilterType] = useState<FilterType>("upcoming");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const {
    data: tickets = [],
    isLoading: ticketsLoading,
  } = trpc.tickets.list.useQuery(undefined, {
    enabled: isAuthenticated && !!user,
  });

  const filteredTickets = useMemo(() => {
    const now = new Date();
    let filtered = tickets.filter(
      (item: TicketWithEvent): item is TicketWithNonNullEvent =>
        item.event !== null
    );

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (item: TicketWithNonNullEvent) => item.status === statusFilter
      );
    }

    // Filter by city
    if (selectedCity) {
      filtered = filtered.filter(
        (item: TicketWithNonNullEvent) =>
          item.event.city === selectedCity
      );
    }

    // Filter by event date
    if (filterType === "upcoming") {
      filtered = filtered.filter(
        (item: TicketWithNonNullEvent) =>
          new Date(`${item.event.date}T${item.event.time || "00:00"}`) >= now
      );
    } else if (filterType === "past") {
      filtered = filtered.filter(
        (item: TicketWithNonNullEvent) =>
          new Date(`${item.event.date}T${item.event.time || "00:00"}`) < now
      );
    }

    return filtered.sort(
      (a: TicketWithNonNullEvent, b: TicketWithNonNullEvent) =>
        new Date(`${b.event.date}T${b.event.time || "00:00"}`).getTime() -
        new Date(`${a.event.date}T${a.event.time || "00:00"}`).getTime()
    );
  }, [tickets, filterType, statusFilter, selectedCity]);

  const cities = useMemo(() => {
    const citySet = new Set<string>();
    tickets.forEach((item: TicketWithEvent) => {
      if (item.event?.city) {
        citySet.add(item.event.city);
      }
    });
    return Array.from(citySet).sort();
  }, [tickets]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "refunded":
        return <AlertCircle className="w-4 h-4 text-amber-600" />;
      case "pending":
        return <AlertCircle className="w-4 h-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-50 text-green-700 border-green-200";
      case "refunded":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "pending":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header + filters */}
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
              {filteredTickets.length} ticket{filteredTickets.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="border-t border-slate-100">
          <div className="max-w-6xl mx-auto px-4 py-3 space-y-3">
            {/* Date filters */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {(["upcoming", "past", "all"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                    filterType === type
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {type === "upcoming"
                    ? "Upcoming"
                    : type === "past"
                    ? "Past"
                    : "All Events"}
                </button>
              ))}
            </div>

            {/* Status filters */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {(["all", "paid", "pending", "refunded"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                    statusFilter === status
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {status === "all"
                    ? "All Status"
                    : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {/* City filters */}
            {cities.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setSelectedCity(null)}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm whitespace-nowrap transition-colors ${
                    selectedCity === null
                      ? "bg-amber-500 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  All Cities
                </button>
                {cities.map((city) => (
                  <button
                    key={city}
                    onClick={() => setSelectedCity(city)}
                    className={`px-3 py-1.5 rounded-full text-xs sm:text-sm capitalize whitespace-nowrap transition-colors ${
                      selectedCity === city
                        ? "bg-amber-500 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {ticketsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-12">
            <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {tickets.length === 0
                ? "No tickets yet"
                : "No tickets match your filters"}
            </h3>
            {tickets.length === 0 && (
              <Button
                onClick={() => router.push("/")}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Browse Events
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTickets.map((ticketItem: TicketWithNonNullEvent) => {
              const event = ticketItem.event;
              const isPast =
                new Date(`${event.date}T${event.time || "00:00"}`) <
                new Date();

              return (
                <Card
                  key={ticketItem.id}
                  className={`overflow-hidden hover:shadow-lg transition-shadow ${
                    isPast ? "opacity-75" : ""
                  }`}
                >
                  <div className="p-4 flex flex-col sm:flex-row gap-4">
                    {/* Event image */}
                    {event.image && (
                      <div className="w-full sm:w-32 h-40 sm:h-32 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Ticket details */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold text-slate-900 line-clamp-2">
                            {event.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-600 capitalize">
                            {event.city} · {event.category}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 self-start sm:self-auto">
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded whitespace-nowrap">
                            {ticketItem.quantity} ticket
                            {ticketItem.quantity !== 1 ? "s" : ""}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded border flex items-center gap-1 whitespace-nowrap ${getStatusColor(
                              ticketItem.status
                            )}`}
                          >
                            {getStatusIcon(ticketItem.status)}
                            {ticketItem.status.charAt(0).toUpperCase() +
                              ticketItem.status.slice(1)}
                          </span>
                        </div>
                      </div>

                      {/* Event info */}
                      <div className="space-y-1 text-xs sm:text-sm text-slate-600 mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>{formatDate(event.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          <span>{formatTime(event.time)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{event.venue}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                          Order #{ticketItem.id} · {ticketItem.currency}{" "}
                          {Number(ticketItem.total).toFixed(2)}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="mt-auto flex flex-col sm:flex-row gap-2">
                        <Button
                          onClick={() =>
                            router.push(`/${event.citySlug}/${event.slug}`)
                          }
                          variant="outline"
                          size="sm"
                          className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 w-full sm:w-auto"
                        >
                          View Event
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-slate-600 border-slate-200 hover:bg-slate-50 w-full sm:w-auto flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download Ticket
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
