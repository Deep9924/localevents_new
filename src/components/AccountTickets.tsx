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
  QrCode,
} from "lucide-react";
import QRCode from "react-qr-code";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { formatDate, formatTime } from "@/lib/utils";
import type { AppRouter } from "@/server/routers";
import type { inferRouterOutputs } from "@trpc/server";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type TicketItem = RouterOutputs["tickets"]["list"][number];
type TicketWithEvent = TicketItem & {
  event: NonNullable<TicketItem["event"]>;
};

type FilterType = "upcoming" | "past";

const parseEventDate = (dateStr: string, timeStr?: string): Date => {
  let eventDate: Date;
  if (dateStr.includes(",")) {
    const currentYear = new Date().getFullYear();
    eventDate = new Date(`${dateStr}, ${currentYear} ${timeStr || "00:00"}`);
  } else {
    eventDate = new Date(`${dateStr}T${timeStr || "00:00"}`);
  }
  if (isNaN(eventDate.getTime())) return new Date();
  return eventDate;
};

function getTicketCount(ticket: TicketItem): number {
  if (
    "quantity" in ticket &&
    typeof (ticket as Record<string, unknown>).quantity === "number"
  ) {
    return Math.max(
      1,
      (ticket as Record<string, unknown>).quantity as number
    );
  }
  return 1;
}

function QrStrip({
  totalTickets,
  ticketCode,
}: {
  totalTickets: number;
  ticketCode: string;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(index);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
      <div className="mb-2 flex items-center justify-between px-1 text-xs text-slate-500">
        <span className="font-medium text-slate-700">
          Ticket {activeIndex + 1}
          <span className="ml-1 font-normal text-slate-400">
            of {totalTickets}
          </span>
        </span>
        <span className="font-mono text-slate-400">{ticketCode}</span>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory gap-0 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {Array.from({ length: totalTickets }).map((_, i) => {
          const codeValue = `${ticketCode}-${String(i + 1).padStart(3, "0")}`;

          return (
            <div key={i} className="w-full min-w-full snap-center">
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  Ticket {i + 1}
                </p>

                <div className="flex justify-center">
                  <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
                    <QRCode
                      value={codeValue}
                      size={148}
                      bgColor="#FFFFFF"
                      fgColor="#0f172a"
                    />
                  </div>
                </div>

                <p className="mt-2 text-center font-mono text-[10px] tracking-widest text-slate-400">
                  {codeValue}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {totalTickets > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {Array.from({ length: totalTickets }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                const el = scrollRef.current;
                if (!el) return;
                el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
              }}
              aria-label={`Go to ticket ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === activeIndex ? "w-5 bg-indigo-500" : "w-1.5 bg-slate-300"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AccountTickets() {
  const { user, loading: authLoading, isAuthenticated } = useAuth({
    redirectOnUnauthenticated: true,
  });
  const router = useRouter();
  const [filterType, setFilterType] = useState<FilterType>("upcoming");
  const [expandedTicket, setExpandedTicket] = useState<string | number | null>(
    null
  );

  const { data: tickets = [], isLoading: ticketsLoading } =
    trpc.tickets.list.useQuery(undefined, { enabled: !!user });

  const filteredTickets = useMemo(() => {
    const now = new Date();
    return (tickets as TicketItem[])
      .filter((item): item is TicketWithEvent => item.event !== null)
      .filter((item) => {
        const d = parseEventDate(item.event.date, item.event.time);
        return filterType === "upcoming" ? d >= now : d < now;
      })
      .sort((a, b) => {
        const da = parseEventDate(a.event.date, a.event.time).getTime();
        const db = parseEventDate(b.event.date, b.event.time).getTime();
        return filterType === "upcoming" ? da - db : db - da;
      });
  }, [tickets, filterType]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="mb-4 flex items-center gap-3">
            <button
              onClick={() => router.push("/account/profile")}
              className="rounded-full p-2 transition-colors hover:bg-slate-100"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </button>

            <div>
              <h1 className="text-xl font-semibold text-slate-900">Tickets</h1>
              <p className="text-sm text-slate-500">
                View and manage your purchased tickets
              </p>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex rounded-2xl bg-slate-100 p-1">
            {(["upcoming", "past"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                  filterType === type
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {type === "upcoming" ? "Upcoming" : "Past Tickets"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-4 py-6">
        {ticketsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <Ticket className="h-6 w-6 text-slate-400" />
            </div>

            <h3 className="text-lg font-semibold text-slate-900">
              {filterType === "upcoming"
                ? "No upcoming tickets"
                : "No past tickets"}
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
              Your purchased tickets will appear here once you buy an event
              ticket.
            </p>

            <Button
              onClick={() => router.push("/")}
              className="mt-6 rounded-xl bg-indigo-600 px-6 hover:bg-indigo-700"
            >
              Explore Events
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticket) => {
              const event = ticket.event;
              const isPast = filterType === "past";
              const count = getTicketCount(ticket);
              const ticketCode = `TKT-${String(ticket.id).toUpperCase()}`;
              const isExpanded = expandedTicket === ticket.id;

              return (
                <Card
                  key={ticket.id}
                  className={`overflow-hidden border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md ${
                    isPast ? "opacity-80" : ""
                  }`}
                >
                  <div className="p-4 sm:p-5">
                    {/* Event info row */}
                    <div className="flex gap-4">
                      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                        <img
                          src={event.image || "/placeholder-event.jpg"}
                          alt={event.title}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold text-slate-900">
                              {event.title}
                            </h3>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {event.city} · {event.category}
                            </p>
                          </div>

                          {event.price && (
                            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                              {event.price}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {formatDate(event.date)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {formatTime(event.time)}
                          </span>
                          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-600">
                            {count} {count === 1 ? "ticket" : "tickets"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions + expandable QR */}
                    <div className="mt-4 border-t border-slate-100 pt-4">
                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() =>
                            router.push(`/${event.citySlug}/${event.slug}`)
                          }
                          className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200"
                        >
                          View event
                        </button>

                        <button
                          onClick={() =>
                            router.push(`/account/payments/${ticket.id}`)
                          }
                          className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200"
                        >
                          Payment details
                        </button>

                        <button
                          onClick={() =>
                            setExpandedTicket((prev) =>
                              prev === ticket.id ? null : ticket.id
                            )
                          }
                          className="flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-100"
                        >
                          <QrCode className="h-3.5 w-3.5" />
                          {isExpanded ? "Hide QR code" : "Show QR code"}
                        </button>
                      </div>

                      {/* Expandable QR panel */}
                      {isExpanded && (
                        <div className="mt-4">
                          <QrStrip
                            totalTickets={count}
                            ticketCode={ticketCode}
                          />
                        </div>
                      )}
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
