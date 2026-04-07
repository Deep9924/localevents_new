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
  ChevronDown,
  CreditCard,
  MapPin,
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
type ExpandedPanel = "qr" | "payment" | null;

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
    return Math.max(1, (ticket as Record<string, unknown>).quantity as number);
  }
  return 1;
}

function QrPanel({
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
    <div className="border-t border-slate-100 bg-slate-50/60 px-4 pb-5 pt-4 sm:px-5">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {Array.from({ length: totalTickets }).map((_, i) => {
          const codeValue = `${ticketCode}-${String(i + 1).padStart(3, "0")}`;
          return (
            <div
              key={i}
              className="flex w-full min-w-full snap-center flex-col items-center"
            >
              {/* QR container with decorative notch effect */}
              <div className="relative w-full max-w-[240px] rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
                {/* Ticket count badge */}
                {totalTickets > 1 && (
                  <span className="absolute right-3 top-3 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                    {i + 1}/{totalTickets}
                  </span>
                )}
                <div className="flex justify-center">
                  <QRCode
                    value={codeValue}
                    size={168}
                    bgColor="#ffffff"
                    fgColor="#0f172a"
                  />
                </div>
                <p className="mt-3 text-center font-mono text-[11px] tracking-widest text-slate-400">
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
                i === activeIndex ? "w-5 bg-slate-700" : "w-1.5 bg-slate-300"
              }`}
            />
          ))}
        </div>
      )}

      <p className="mt-3 text-center text-[11px] text-slate-400">
        Present this QR code at the venue entrance
      </p>
    </div>
  );
}

function PaymentPanel({ ticket }: { ticket: TicketWithEvent }) {
  const event = ticket.event;
  const count = getTicketCount(ticket);
  const rawPrice =
    (ticket as Record<string, unknown>).totalPrice ??
    (event.price ? event.price.replace(/[^0-9.]/g, "") : "0");
  const priceNum = parseFloat(String(rawPrice));
  const unitLabel = isNaN(priceNum) || priceNum === 0 ? "Free" : event.price ?? "Free";
  const totalLabel = isNaN(priceNum) || priceNum === 0 ? "Free" : `CAD ${priceNum.toFixed(2)}`;

  return (
    <div className="border-t border-slate-100 bg-slate-50/60 px-4 pb-5 pt-4 sm:px-5">
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200/60">
        {/* Line items */}
        <div className="flex items-center justify-between px-4 py-3 text-xs">
          <span className="text-slate-500">
            {unitLabel} × {count} {count === 1 ? "ticket" : "tickets"}
          </span>
          <span className="font-medium text-slate-700">{totalLabel}</span>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-3 text-xs">
          <span className="font-semibold text-slate-700">Total paid</span>
          <span className="font-semibold text-slate-900">{totalLabel}</span>
        </div>

        {/* Meta */}
        <div className="space-y-2 border-t border-slate-100 px-4 py-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Order ID</span>
            <span className="font-mono text-slate-500">
              #{String(ticket.id).toUpperCase()}
            </span>
          </div>
          {(() => {
            const createdAt = (ticket as Record<string, unknown>).createdAt;
            if (!createdAt) return null;
            return (
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Purchased</span>
                <span className="text-slate-500">
                  {new Date(String(createdAt)).toLocaleDateString("en-CA", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

export default function AccountTickets() {
  const { user, loading: authLoading, isAuthenticated } = useAuth({
    redirectOnUnauthenticated: true,
  });
  const router = useRouter();
  const [filterType, setFilterType] = useState<FilterType>("upcoming");
  const [expanded, setExpanded] = useState<
    Record<string | number, ExpandedPanel>
  >({});

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

  const togglePanel = (ticketId: string | number, panel: "qr" | "payment") => {
    setExpanded((prev) => ({
      ...prev,
      [ticketId]: prev[ticketId] === panel ? null : panel,
    }));
  };

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
                className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <Ticket className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              {filterType === "upcoming" ? "No upcoming tickets" : "No past tickets"}
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
              Your purchased tickets will appear here once you buy an event ticket.
            </p>
            <Button
              onClick={() => router.push("/")}
              className="mt-6 rounded-xl bg-slate-900 px-6 hover:bg-slate-700"
            >
              Explore Events
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => {
              const event = ticket.event;
              const isPast = filterType === "past";
              const count = getTicketCount(ticket);
              const ticketCode = `TKT-${String(ticket.id).toUpperCase()}`;
              const openPanel = expanded[ticket.id] ?? null;

              return (
                <Card
                  key={ticket.id}
                  className={`overflow-hidden border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md ${
                    isPast ? "opacity-70" : ""
                  }`}
                >
                  {/* Event info row */}
                  <button
                    onClick={() =>
                      router.push(`/${event.citySlug}/${event.slug}`)
                    }
                    className="flex w-full gap-4 p-4 text-left transition-colors hover:bg-slate-50/70 sm:p-5"
                  >
                    {/* Thumbnail */}
                    <div className="h-[76px] w-[76px] flex-shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-100">
                      <img
                        src={event.image || "/placeholder-event.jpg"}
                        alt={event.title}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Title */}
                      <h3 className="truncate text-sm font-semibold leading-snug text-slate-900">
                        {event.title}
                      </h3>

                      {/* Date */}
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="h-3 w-3 shrink-0" />
                        {formatDate(event.date)}
                        <span className="mx-0.5 text-slate-300">·</span>
                        <Clock className="h-3 w-3 shrink-0" />
                        {formatTime(event.time)}
                      </p>

                      {/* Venue */}
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{event.venue ?? event.city}</span>
                      </p>

                      {/* Price + ticket count row */}
                      <div className="mt-1.5 flex items-center gap-3">
                        {event.price && (
                          <span className="text-xs font-semibold text-slate-700">
                            {event.price}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Ticket className="h-3 w-3 shrink-0" />
                          {count} {count === 1 ? "ticket" : "tickets"}
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* Action bar */}
                  <div className="grid grid-cols-2 gap-1 border-t border-slate-100 px-3 py-2 sm:px-4">
                    <button
                      onClick={() => togglePanel(ticket.id, "payment")}
                      className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors ${
                        openPanel === "payment"
                          ? "bg-slate-100 text-slate-900"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                      }`}
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      Payment
                      <ChevronDown
                        className={`h-3 w-3 transition-transform duration-200 ${
                          openPanel === "payment" ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <button
                      onClick={() => togglePanel(ticket.id, "qr")}
                      className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors ${
                        openPanel === "qr"
                          ? "bg-slate-100 text-slate-900"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                      }`}
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      QR Code
                      <ChevronDown
                        className={`h-3 w-3 transition-transform duration-200 ${
                          openPanel === "qr" ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {/* Panels */}
                  {openPanel === "qr" && (
                    <QrPanel totalTickets={count} ticketCode={ticketCode} />
                  )}
                  {openPanel === "payment" && (
                    <PaymentPanel ticket={ticket} />
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
