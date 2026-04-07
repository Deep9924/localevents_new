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
    <div className="border-t border-slate-100 px-4 pb-4 pt-3 sm:px-5">
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
              <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200/80">
                <QRCode
                  value={codeValue}
                  size={140}
                  bgColor="#f8fafc"
                  fgColor="#0f172a"
                />
              </div>
              <p className="mt-2 font-mono text-[10px] tracking-widest text-slate-400">
                {codeValue}
              </p>
              {totalTickets > 1 && (
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {i + 1} / {totalTickets}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {totalTickets > 1 && (
        <div className="mt-2 flex justify-center gap-1.5">
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
                i === activeIndex ? "w-4 bg-slate-700" : "w-1.5 bg-slate-300"
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

  return (
    <div className="border-t border-slate-100 px-4 pb-4 pt-3 sm:px-5">
      <div className="space-y-2 rounded-xl bg-slate-50 p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">
            {event.price ?? "Free"} × {count}{" "}
            {count === 1 ? "ticket" : "tickets"}
          </span>
          <span className="font-medium text-slate-700">
            {isNaN(priceNum) || priceNum === 0
              ? event.price ?? "Free"
              : `CAD ${priceNum.toFixed(2)}`}
          </span>
        </div>
        <div className="border-t border-slate-200 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700">Total paid</span>
            <span className="font-semibold text-slate-900">
              {isNaN(priceNum) || priceNum === 0
                ? "Free"
                : `CAD ${priceNum.toFixed(2)}`}
            </span>
          </div>
        </div>
        <div className="border-t border-slate-200 pt-2 text-xs text-slate-400">
          <div className="flex items-center justify-between">
            <span>Order ID</span>
            <span className="font-mono">#{String(ticket.id).toUpperCase()}</span>
          </div>
          {(() => {
            const createdAt = (ticket as Record<string, unknown>).createdAt;
            if (!createdAt) return null;
            return (
              <div className="mt-1 flex items-center justify-between">
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
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="mb-4 flex items-center gap-3">
            <button
              onClick={() => router.push("/account/profile")}
              className="rounded-full p-1.5 transition-colors hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4 text-slate-500" />
            </button>
            <h1 className="text-base font-semibold text-slate-900">My Tickets</h1>
          </div>

          {/* Underline tabs */}
          <div className="flex gap-5 border-b border-slate-100">
            {(["upcoming", "past"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`pb-2.5 text-sm transition-all border-b-2 -mb-px ${
                  filterType === type
                    ? "border-slate-900 text-slate-900 font-medium"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                {type === "upcoming" ? "Upcoming" : "Past"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-2xl px-4 py-5">
        {ticketsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl border border-slate-100 bg-white"
              />
            ))}
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white px-6 py-16 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <Ticket className="h-5 w-5 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-700">
              {filterType === "upcoming"
                ? "No upcoming tickets"
                : "No past tickets"}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Your tickets will appear here after purchase.
            </p>
            {filterType === "upcoming" && (
              <Button
                onClick={() => router.push("/")}
                className="mt-5 rounded-xl bg-slate-900 px-5 text-sm hover:bg-slate-700"
              >
                Explore Events
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredTickets.map((ticket) => {
              const event = ticket.event;
              const isPast = filterType === "past";
              const count = getTicketCount(ticket);
              const ticketCode = `TKT-${String(ticket.id).toUpperCase()}`;
              const openPanel = expanded[ticket.id] ?? null;

              const rawPrice =
                (ticket as Record<string, unknown>).totalPrice ??
                (event.price ? event.price.replace(/[^0-9.]/g, "") : "0");
              const priceNum = parseFloat(String(rawPrice));
              const displayPrice =
                isNaN(priceNum) || priceNum === 0
                  ? event.price ?? "Free"
                  : `CAD ${priceNum.toFixed(2)}`;

              return (
                <div
                  key={ticket.id}
                  className={`overflow-hidden rounded-2xl border bg-white transition-all ${
                    openPanel
                      ? "border-slate-200 shadow-sm"
                      : "border-slate-100 hover:border-slate-200"
                  } ${isPast ? "opacity-60" : ""}`}
                >
                  {/* Card body */}
                  <button
                    onClick={() =>
                      router.push(`/${event.citySlug}/${event.slug}`)
                    }
                    className="flex w-full gap-3 p-3.5 text-left transition-colors hover:bg-slate-50/60"
                  >
                    {/* Image — taller, fills height */}
                    <div
                      className="relative flex-shrink-0 overflow-hidden rounded-xl bg-slate-100"
                      style={{ width: 68, height: 84 }}
                    >
                      <img
                        src={event.image || "/placeholder-event.jpg"}
                        alt={event.title}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      {isPast && (
                        <div className="absolute inset-0 bg-white/30" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                      {/* Top: title + past badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-slate-900 leading-snug">
                            {event.title}
                          </h3>
                          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                            <MapPin className="h-2.5 w-2.5 shrink-0" />
                            <span className="truncate">
                              {event.venue ?? event.city}
                            </span>
                          </p>
                        </div>
                        {isPast && (
                          <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                            Past
                          </span>
                        )}
                      </div>

                      {/* Bottom meta: date · time · price · qty */}
                      <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 shrink-0 text-slate-400" />
                          {formatDate(event.date)}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 shrink-0 text-slate-400" />
                          {formatTime(event.time)}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="font-medium text-slate-700">
                          {displayPrice}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-500">
                          {count} {count === 1 ? "ticket" : "tickets"}
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* Action bar */}
                  <div className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100">
                    <button
                      onClick={() => togglePanel(ticket.id, "payment")}
                      className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                        openPanel === "payment"
                          ? "bg-slate-50 text-slate-900"
                          : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                      }`}
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      Payment
                      <ChevronDown
                        className={`h-3 w-3 transition-transform ${
                          openPanel === "payment" ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <button
                      onClick={() => togglePanel(ticket.id, "qr")}
                      className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                        openPanel === "qr"
                          ? "bg-slate-50 text-slate-900"
                          : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                      }`}
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      QR Code
                      <ChevronDown
                        className={`h-3 w-3 transition-transform ${
                          openPanel === "qr" ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {/* Expandable panels */}
                  {openPanel === "qr" && (
                    <QrPanel totalTickets={count} ticketCode={ticketCode} />
                  )}
                  {openPanel === "payment" && (
                    <PaymentPanel ticket={ticket} />
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
