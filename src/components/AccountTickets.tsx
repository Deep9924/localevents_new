"use client";

import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
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
    <div className="bg-slate-50/60 px-5 pb-7 pt-5">
      <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-widest text-slate-400">
        Scan at Entry
      </p>
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
              className="flex w-full min-w-full snap-center flex-col items-center py-1"
            >
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <QRCode
                  value={codeValue}
                  size={170}
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                />
              </div>
              <p className="mt-3 font-mono text-[11px] tracking-widest text-slate-400">
                {codeValue}
              </p>
              {totalTickets > 1 && (
                <p className="mt-1 text-[11px] text-slate-400">
                  {i + 1} / {totalTickets}
                </p>
              )}
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
  const totalLabel =
    isNaN(priceNum) || priceNum === 0 ? "Free" : `CAD ${priceNum.toFixed(2)}`;

  return (
    <div className="bg-slate-50/60 px-5 pb-7 pt-5">
      <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-widest text-slate-400">
        Payment Details
      </p>
      <div className="space-y-2.5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            {event.price ?? "Free"} × {count}{" "}
            {count === 1 ? "ticket" : "tickets"}
          </span>
          <span>{totalLabel}</span>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-sm">
          <span className="font-semibold text-slate-700">Total paid</span>
          <span className="font-semibold text-slate-900">{totalLabel}</span>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-400">
          <span>Order ID</span>
          <span className="font-mono">#{String(ticket.id).toUpperCase()}</span>
        </div>
        {(() => {
          const createdAt = (ticket as Record<string, unknown>).createdAt;
          if (!createdAt) return null;
          return (
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Purchased</span>
              <span>
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
      {/* Header — NOT sticky */}
      <div className="border-b border-slate-200 bg-white">
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

          {/* Filter tabs — NOT sticky */}
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
      <div className="mx-auto max-w-3xl px-4 py-8 pb-16">
        {ticketsLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-3xl border border-slate-200 bg-white"
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
              className="mt-6 rounded-xl bg-slate-900 px-6 hover:bg-slate-700"
            >
              Explore Events
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredTickets.map((ticket) => {
              const event = ticket.event;
              const isPast = filterType === "past";
              const count = getTicketCount(ticket);
              const ticketCode = `TKT-${String(ticket.id).toUpperCase()}`;
              const openPanel = expanded[ticket.id] ?? null;

              return (
                <div
                  key={ticket.id}
                  className={`overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md ${
                    isPast ? "opacity-70" : ""
                  }`}
                >
                  {/* Hero image — clean with no text overlay */}
                  <button
                    onClick={() =>
                      router.push(`/${event.citySlug}/${event.slug}`)
                    }
                    className="group relative block w-full overflow-hidden"
                  >
                    <div className="relative h-56 w-full sm:h-64">
                      <img
                        src={event.image || "/placeholder-event.jpg"}
                        alt={event.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {/* Subtle past desaturation only */}
                      {isPast && (
                        <div className="absolute inset-0 bg-slate-900/25" />
                      )}
                    </div>
                  </button>

                  {/* Event info — all below the image */}
                  <div className="px-5 pt-5 pb-2">
                    {/* Title */}
                    <h3 className="text-[17px] font-bold leading-snug text-slate-900">
                      {event.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                      {event.city} · {event.category}
                    </p>

                    {/* Date / time / venue */}
                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                      <span className="flex items-center gap-1.5 text-[13px] text-slate-500">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {formatDate(event.date)}
                      </span>
                      <span className="flex items-center gap-1.5 text-[13px] text-slate-500">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {formatTime(event.time)}
                      </span>
                      <span className="flex items-center gap-1.5 text-[13px] text-slate-500">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        <span className="max-w-[150px] truncate">
                          {event.venue ?? event.city}
                        </span>
                      </span>
                    </div>

                    {/* Tickets purchased pill + price — bottom of info block */}
                    <div className="mt-4 mb-5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-1.5 text-[13px] font-medium text-slate-600">
                        <Ticket className="h-3.5 w-3.5" />
                        {count} {count === 1 ? "ticket" : "tickets"} purchased
                      </div>
                      {event.price && (
                        <span className="text-sm font-semibold text-slate-800">
                          {event.price}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Clean separator */}
                  <div className="mx-5 border-t border-slate-100" />

                  {/* Action buttons — generous padding for easy tapping */}
                  <div className="grid grid-cols-2 gap-2.5 px-5 py-4">
                    <button
                      onClick={() => togglePanel(ticket.id, "payment")}
                      className={`flex items-center justify-center gap-2 rounded-xl py-3.5 text-[13px] font-medium transition-colors ${
                        openPanel === "payment"
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                      }`}
                    >
                      <CreditCard className="h-4 w-4" />
                      Payment
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform duration-200 ${
                          openPanel === "payment" ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <button
                      onClick={() => togglePanel(ticket.id, "qr")}
                      className={`flex items-center justify-center gap-2 rounded-xl py-3.5 text-[13px] font-medium transition-colors ${
                        openPanel === "qr"
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                      }`}
                    >
                      <QrCode className="h-4 w-4" />
                      QR Code
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform duration-200 ${
                          openPanel === "qr" ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {/* Expanded panels */}
                  {openPanel === "qr" && (
                    <>
                      <div className="mx-5 border-t border-slate-100" />
                      <QrPanel totalTickets={count} ticketCode={ticketCode} />
                    </>
                  )}
                  {openPanel === "payment" && (
                    <>
                      <div className="mx-5 border-t border-slate-100" />
                      <PaymentPanel ticket={ticket} />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
