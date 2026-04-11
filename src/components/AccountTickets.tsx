"use client";

import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Loader2, ArrowLeft, Ticket, Calendar, QrCode,
  ChevronDown, ChevronLeft, ChevronRight, CreditCard,
  MapPin, CheckCircle, Clock,
} from "lucide-react";
import QRCode from "react-qr-code";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useCallback, Suspense } from "react";
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
  if (/^d{4}-d{2}-d{2}$/.test(dateStr)) {
    const d = new Date(`${dateStr}T${timeStr || "00:00"}:00`);
    if (!isNaN(d.getTime())) return d;
  }
  if (dateStr.includes(",")) {
    const currentYear = new Date().getFullYear();
    const withYear = dateStr.match(/d{4}/)
      ? `${dateStr} ${timeStr || "00:00"}`
      : `${dateStr} ${currentYear} ${timeStr || "00:00"}`;
    const d = new Date(withYear);
    if (!isNaN(d.getTime())) return d;
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;
  return new Date();
};

function getTicketCount(ticket: TicketItem): number {
  return ticket.quantity || 1;
}

/* ─── QR Panel ───────────────────────────────────────────────────────────── */
function QrPanel({ totalTickets, ticketCode }: { totalTickets: number; ticketCode: string }) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setActiveIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  const goTo = (i: number) => {
    scrollRef.current?.scrollTo({ left: i * (scrollRef.current.clientWidth), behavior: "smooth" });
  };

  return (
    <div className="bg-slate-50/60 px-5 pb-7 pt-5">
      <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-widest text-slate-400">
        Scan at Entry
      </p>

      <div className="relative">
        {totalTickets > 1 && activeIndex > 0 && (
          <button type="button" onClick={() => goTo(activeIndex - 1)}
            className="absolute left-0 top-1/2 z-10 -translate-x-3 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-slate-200 hover:bg-slate-50">
            <ChevronLeft className="h-4 w-4 text-slate-600" />
          </button>
        )}

        <div ref={scrollRef} onScroll={handleScroll}
          className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {Array.from({ length: totalTickets }).map((_, i) => {
            const codeValue = `${ticketCode}-${String(i + 1).padStart(3, "0")}`;
            return (
              <div key={i} className="flex w-full min-w-full snap-center flex-col items-center py-1">
                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <QRCode value={codeValue} size={170} bgColor="#ffffff" fgColor="#0f172a" />
                </div>
                <p className="mt-3 font-mono text-[11px] tracking-widest text-slate-400">{codeValue}</p>
                {totalTickets > 1 && (
                  <p className="mt-1 text-[11px] text-slate-400">{i + 1} / {totalTickets}</p>
                )}
              </div>
            );
          })}
        </div>

        {totalTickets > 1 && activeIndex < totalTickets - 1 && (
          <button type="button" onClick={() => goTo(activeIndex + 1)}
            className="absolute right-0 top-1/2 z-10 translate-x-3 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-slate-200 hover:bg-slate-50">
            <ChevronRight className="h-4 w-4 text-slate-600" />
          </button>
        )}
      </div>

      {totalTickets > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {Array.from({ length: totalTickets }).map((_, i) => (
            <button key={i} type="button" onClick={() => goTo(i)} aria-label={`Go to ticket ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === activeIndex ? "w-5 bg-slate-700" : "w-1.5 bg-slate-300"}`} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Payment Panel ──────────────────────────────────────────────────────── */
function PaymentPanel({ ticket }: { ticket: TicketWithEvent }) {
  const count = getTicketCount(ticket);
  const totalNum = Number(ticket.total);
  const totalLabel = totalNum === 0 ? "Free" : `CAD ${totalNum.toFixed(2)}`;

  return (
    <div className="bg-slate-50/60 px-5 pb-7 pt-5">
      <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-widest text-slate-400">
        Payment Details
      </p>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="bg-slate-50/80 px-4 py-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Order Info</p>
          <div className="mb-1.5 flex items-center justify-between text-[12px]">
            <span className="text-slate-400">Order ID</span>
            <span className="font-mono font-medium text-slate-700">#{String(ticket.id).toUpperCase()}</span>
          </div>
          <div className="mb-1.5 flex items-center justify-between text-[12px]">
            <span className="text-slate-400">Status</span>
            <span className="inline-flex items-center gap-1">
              {ticket.status === "paid" ? (
                <>
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  <span className="font-medium text-green-700">Confirmed</span>
                </>
              ) : ticket.status === "pending" ? (
                <>
                  <Clock className="w-3 h-3 text-amber-500" />
                  <span className="font-medium text-amber-600">Pending</span>
                </>
              ) : (
                <span className="font-medium text-slate-500 capitalize">{ticket.status}</span>
              )}
            </span>
          </div>
          {ticket.createdAt != null && (
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-slate-400">Purchased</span>
              <span className="text-slate-700">
                {new Date(String(ticket.createdAt)).toLocaleDateString("en-CA", {
                  year: "numeric", month: "short", day: "numeric",
                })}
              </span>
            </div>
          )}
        </div>

        <div className="border-t border-dashed border-slate-200" />

        <div className="px-4 py-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Price Summary</p>
          <div className="mb-1.5 flex items-center justify-between text-[12px]">
            <span className="text-slate-500">Quantity</span>
            <span className="text-slate-700 font-medium">{count} {count === 1 ? "ticket" : "tickets"}</span>
          </div>
          {Number(ticket.serviceFee ?? 0) > 0 && (
            <div className="mb-1.5 flex items-center justify-between text-[12px]">
              <span className="text-slate-500">Service fee (3%)</span>
              <span className="text-slate-700">CAD {Number(ticket.serviceFee).toFixed(2)}</span>
            </div>
          )}
          {Number(ticket.taxAmount ?? 0) > 0 && (
            <div className="mb-1.5 flex items-center justify-between text-[12px]">
              <span className="text-slate-500">Tax</span>
              <span className="text-slate-700">CAD {Number(ticket.taxAmount).toFixed(2)}</span>
            </div>
          )}
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
            <span className="text-sm font-semibold text-slate-700">Total paid</span>
            <span className="text-sm font-bold text-slate-900">{totalLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
function AccountTicketsInner() {
  const { user, loading: authLoading, isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const router = useRouter();
  const [filterType, setFilterType] = useState<FilterType>("upcoming");
  const [expanded, setExpanded] = useState<Record<string | number, ExpandedPanel>>({});

  const { data: tickets = [], isLoading: ticketsLoading } = trpc.tickets.list.useQuery(
    undefined,
    { enabled: !!user }
  );

  const filteredTickets = useMemo(() => {
    const now = new Date();

    // Only show paid tickets — never show pending
    const validTickets = tickets.filter(
      (item: TicketItem): item is TicketWithEvent =>
        item.event !== null && item.status === "paid"
    );

    if (filterType === "upcoming") {
      // Upcoming = event date is today or in the future
      return validTickets
        .filter((item) => parseEventDate(item.event.date, item.event.time) >= now)
        .sort((a, b) =>
          parseEventDate(a.event.date, a.event.time).getTime() -
          parseEventDate(b.event.date, b.event.time).getTime()
        );
    }

    // Past = event date is before now
    return validTickets
      .filter((item) => parseEventDate(item.event.date, item.event.time) < now)
      .sort((a, b) =>
        parseEventDate(b.event.date, b.event.time).getTime() -
        parseEventDate(a.event.date, a.event.time).getTime()
      );
  }, [tickets, filterType]);

  const togglePanel = useCallback((id: number, panel: ExpandedPanel) => {
    setExpanded((prev) => ({ ...prev, [id]: prev[id] === panel ? null : panel }));
  }, []);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header — NOT sticky */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="mb-5 flex items-center gap-4">
            <button
              onClick={() => router.push("/account/profile")}
              className="group flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 transition hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4 text-slate-600 transition group-hover:-translate-x-0.5" />
            </button>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Tickets</h1>
          </div>

          {/* Filter tabs — NOT sticky */}
          <div className="flex rounded-2xl bg-slate-100 p-1">
            {(["upcoming", "past"] as const).map((type) => (
              <button
                key={type}
                onClick={() => { setFilterType(type); setExpanded({}); }}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all
                  ${filterType === type
                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50"
                    : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                {type === "upcoming" ? "Upcoming" : "Past Events"}
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
              <div key={i} className="h-64 animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm" />
            ))}
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
              <Ticket className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {filterType === "upcoming" ? "No upcoming tickets" : "No past tickets"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">Time to discover some amazing events!</p>
            <Button
              onClick={() => router.push("/")}
              className="mt-6 rounded-2xl bg-slate-900 px-8 py-6 text-sm font-bold hover:bg-slate-800"
            >
              Explore Events
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredTickets.map((ticket) => {
              const event = ticket.event;
              const count = getTicketCount(ticket);
              const openPanel = expanded[ticket.id];
              const ticketCode = `TKT-${String(ticket.id).padStart(6, "0")}`;
              const isPaid = ticket.status === "paid";

              return (
                <div key={ticket.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">

                  {/* Event image */}
                  <button
                    onClick={() => router.push(`/${event.citySlug}/${event.slug}`)}
                    className="group relative block w-full overflow-hidden"
                  >
                    <div className="relative h-48 w-full sm:h-52">
                      <img
                        src={event.image || "/placeholder-event.jpg"}
                        alt={event.title ?? "Event"}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  </button>

                  {/* Event info */}
                  <div className="px-5 pt-4 pb-3">
                    <h3 className="text-[16px] font-bold leading-snug text-slate-900">{event.title}</h3>
                    <p className="mt-0.5 text-xs text-slate-400">{event.city} · {event.category}</p>

                    <div className="mt-3 flex flex-col gap-1.5">
                      <span className="flex items-center gap-1.5 text-[12px] text-slate-500">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        {formatDate(event.date)} · {formatTime(event.time)}
                      </span>
                      <span className="flex items-center gap-1.5 text-[12px] text-slate-500">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{event.eventVenue ?? event.city}</span>
                      </span>
                    </div>

                    <div className="mt-3.5 flex items-center justify-between">
                      <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium
                        ${isPaid ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-600"}`}>
                        <Ticket className="h-3 w-3" />
                        {isPaid
                          ? `${count} ${count === 1 ? "ticket" : "tickets"} confirmed`
                          : "Payment pending"}
                      </div>
                      {event.eventPrice && (
                        <span className="text-[13px] font-semibold text-slate-700">{event.eventPrice}</span>
                      )}
                    </div>
                  </div>

                  <div className="mx-5 border-t border-slate-100" />

                  {/* Action buttons */}
                  <div className="grid grid-cols-2 gap-2 px-5 pt-3 pb-5">
                    <button
                      onClick={() => togglePanel(ticket.id, "payment")}
                      className={`flex items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-medium transition-colors
                        ${openPanel === "payment"
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                        }`}
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      Payment
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${openPanel === "payment" ? "rotate-180" : ""}`} />
                    </button>

                    {/* QR button — disabled if not paid */}
                    <button
                      onClick={() => isPaid && togglePanel(ticket.id, "qr")}
                      disabled={!isPaid}
                      className={`flex items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-medium transition-colors
                        ${!isPaid
                          ? "cursor-not-allowed bg-slate-50 text-slate-300"
                          : openPanel === "qr"
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                        }`}
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      {isPaid ? "QR Code" : "Pending"}
                      {isPaid && (
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${openPanel === "qr" ? "rotate-180" : ""}`} />
                      )}
                    </button>
                  </div>

                  {openPanel === "payment" && (
                    <>
                      <div className="mx-5 border-t border-slate-100" />
                      <PaymentPanel ticket={ticket} />
                    </>
                  )}
                  {openPanel === "qr" && isPaid && (
                    <>
                      <div className="mx-5 border-t border-slate-100" />
                      <QrPanel totalTickets={count} ticketCode={ticketCode} />
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

export default function AccountTickets() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    }>
      <AccountTicketsInner />
    </Suspense>
  );
}
