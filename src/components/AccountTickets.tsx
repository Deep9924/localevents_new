"use client";

import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ArrowLeft,
  Ticket,
  Calendar,
  QrCode,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  MapPin,
} from "lucide-react";
import QRCode from "react-qr-code";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useCallback } from "react";
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

type FeeRow = { label: string; amount: number };

const parseEventDate = (dateStr: string, timeStr?: string): Date => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const d = new Date(`${dateStr}T${timeStr || "00:00"}:00`);
    if (!isNaN(d.getTime())) return d;
  }
  if (dateStr.includes(",")) {
    const currentYear = new Date().getFullYear();
    const withYear = dateStr.match(/\d{4}/)
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
  if (
    "quantity" in ticket &&
    typeof (ticket as Record<string, unknown>).quantity === "number"
  ) {
    return Math.max(1, (ticket as Record<string, unknown>).quantity as number);
  }
  return 1;
}

function getExtraFees(ticket: TicketItem): FeeRow[] {
  // Uncomment and wire to real fields when available:
  // const t = ticket as Record<string, unknown>;
  // return [
  //   { label: "Service fee", amount: Number(t.serviceFee ?? 0) },
  //   { label: "Transaction fee", amount: Number(t.transactionFee ?? 0) },
  // ].filter((f) => f.amount > 0);
  return [];
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

  const goTo = (i: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="bg-slate-50/60 px-5 pb-7 pt-5">
      <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-widest text-slate-400">
        Scan at Entry
      </p>

      <div className="relative">
        {totalTickets > 1 && activeIndex > 0 && (
          <button
            type="button"
            onClick={() => goTo(activeIndex - 1)}
            className="absolute left-0 top-1/2 z-10 -translate-x-3 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4 text-slate-600" />
          </button>
        )}

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

        {totalTickets > 1 && activeIndex < totalTickets - 1 && (
          <button
            type="button"
            onClick={() => goTo(activeIndex + 1)}
            className="absolute right-0 top-1/2 z-10 translate-x-3 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            <ChevronRight className="h-4 w-4 text-slate-600" />
          </button>
        )}
      </div>

      {totalTickets > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {Array.from({ length: totalTickets }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
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
  const extraFees = getExtraFees(ticket);

  const rawUnitPrice = event.price
    ? parseFloat(event.price.replace(/[^0-9.]/g, ""))
    : 0;
  const unitPrice = isNaN(rawUnitPrice) ? 0 : rawUnitPrice;

  const rawTotal = (ticket as Record<string, unknown>).totalPrice;
  const storedTotal =
    rawTotal !== undefined && rawTotal !== null
      ? parseFloat(String(rawTotal))
      : NaN;

  const feesTotal = extraFees.reduce((sum, f) => sum + f.amount, 0);
  const subtotal = unitPrice * count;
  const totalNum = !isNaN(storedTotal) ? storedTotal : subtotal + feesTotal;

  const unitLabel = unitPrice === 0 ? "Free" : `CAD ${unitPrice.toFixed(2)}`;
  const totalLabel = totalNum === 0 ? "Free" : `CAD ${totalNum.toFixed(2)}`;
  const createdAt = (ticket as Record<string, unknown>).createdAt;

  return (
    <div className="bg-slate-50/60 px-5 pb-7 pt-5">
      <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-widest text-slate-400">
        Payment Details
      </p>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        {/* ── Section 1: Order meta ── */}
        <div className="bg-slate-50/80 px-4 py-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Order Info
          </p>
          <div className="mb-1.5 flex items-center justify-between text-[12px]">
            <span className="text-slate-400">Order ID</span>
            <span className="font-mono font-medium text-slate-700">
              #{String(ticket.id).toUpperCase()}
            </span>
          </div>
          {createdAt && (
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-slate-400">Purchased</span>
              <span className="text-slate-700">
                {new Date(String(createdAt)).toLocaleDateString("en-CA", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          )}
        </div>

        {/* ── Dashed divider ── */}
        <div className="border-t border-dashed border-slate-200" />

        {/* ── Section 2: Price breakdown ── */}
        <div className="px-4 py-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Price Breakdown
          </p>

          {/* Ticket subtotal */}
          <div className="mb-1.5 flex items-center justify-between text-[12px]">
            <span className="text-slate-500">
              {unitLabel} × {count} {count === 1 ? "ticket" : "tickets"}
            </span>
            <span className="text-slate-700">
              {unitPrice === 0 ? "Free" : `CAD ${subtotal.toFixed(2)}`}
            </span>
          </div>

          {/* Extra fee rows — rendered when present */}
          {extraFees.map((fee) => (
            <div
              key={fee.label}
              className="mb-1.5 flex items-center justify-between text-[12px]"
            >
              <span className="text-slate-500">{fee.label}</span>
              <span className="text-slate-700">
                CAD {fee.amount.toFixed(2)}
              </span>
            </div>
          ))}

          {/* Total */}
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
            <span className="text-sm font-semibold text-slate-700">
              Total paid
            </span>
            <span className="text-sm font-bold text-slate-900">
              {totalLabel}
            </span>
          </div>
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

  const cardRefs = useRef<Record<string | number, HTMLDivElement | null>>({});

  const { data: tickets = [], isLoading: ticketsLoading } =
    trpc.tickets.list.useQuery(undefined, { enabled: !!user });

  const filteredTickets = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
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

  const togglePanel = useCallback(
    (ticketId: string | number, panel: "qr" | "payment") => {
      setExpanded((prev) => {
        const next = prev[ticketId] === panel ? null : panel;
        if (next !== null) {
          setTimeout(() => {
            const card = cardRefs.current[ticketId];
            if (card) {
              card.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
          }, 50);
        }
        return { ...prev, [ticketId]: next };
      });
    },
    []
  );

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
      {/* ── Header ── */}
<div className="border-b border-slate-200 bg-white">
  <div className="mx-auto max-w-2xl px-4 sm:px-6">
    {/* Row 1: back + title */}
    <div className="flex items-center gap-3 py-3">
      <button
        onClick={() => router.push("/account/profile")}
        className="rounded-full p-1.5 transition-colors hover:bg-slate-100"
      >
        <ArrowLeft className="h-5 w-5 text-slate-600" />
      </button>
      <div>
        <h1 className="text-[17px] font-semibold leading-tight text-slate-900">
          My Tickets
        </h1>
        <p className="text-[12px] text-slate-400">
          View and manage your purchases
        </p>
      </div>
    </div>

    {/* Row 2 wrapper: gives space from bottom border */}
    <div className="pb-3">
      <div className="flex rounded-2xl bg-slate-100 p-1">
        {(["upcoming", "past"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`flex-1 rounded-xl px-6 py-2 text-sm font-medium transition-all ${
              filterType === type
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {type === "upcoming" ? "Upcoming" : "Past Events"}
          </button>
        ))}
      </div>
    </div>
  </div>
</div>

      {/* ── Content ── */}
      <div className="mx-auto max-w-2xl px-4 py-6 pb-16 sm:px-6">
        {ticketsLoading ? (
          <div className="flex flex-col gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-3xl border border-slate-200 bg-white"
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
              {filterType === "upcoming"
                ? "Your upcoming event tickets will appear here."
                : "Events you've attended will show up here."}
            </p>
            {filterType === "upcoming" && (
              <Button
                onClick={() => router.push("/")}
                className="mt-6 rounded-xl bg-slate-900 px-6 hover:bg-slate-700"
              >
                Explore Events
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {filteredTickets.map((ticket) => {
              const event = ticket.event;
              const count = getTicketCount(ticket);
              const ticketCode = `TKT-${String(ticket.id).toUpperCase()}`;
              const openPanel = expanded[ticket.id] ?? null;

              return (
                <div
                  key={ticket.id}
                  ref={(el) => { cardRefs.current[ticket.id] = el; }}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* ── Hero image ── */}
                  <button
                    onClick={() =>
                      router.push(`/${event.citySlug}/${event.slug}`)
                    }
                    className="group relative block w-full overflow-hidden"
                  >
                    <div className="relative h-48 w-full sm:h-52">
                      <img
                        src={event.image || "/placeholder-event.jpg"}
                        alt={event.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  </button>

                  {/* ── Event info ── */}
                  <div className="px-5 pt-4 pb-3">
                    <h3 className="text-[16px] font-bold leading-snug text-slate-900">
                      {event.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {event.city} · {event.category}
                    </p>

                    <div className="mt-3 flex flex-col gap-1.5">
                      <span className="flex items-center gap-1.5 text-[12px] text-slate-500">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        {formatDate(event.date)} · {formatTime(event.time)}
                      </span>
                      <span className="flex items-center gap-1.5 text-[12px] text-slate-500">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">
                          {event.venue ?? event.city}
                        </span>
                      </span>
                    </div>

                    {/* Ticket confirmed pill + price */}
                    <div className="mt-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-[12px] font-medium text-green-700">
                        <Ticket className="h-3 w-3" />
                        {count} {count === 1 ? "ticket" : "tickets"} confirmed
                      </div>
                      {event.price && (
                        <span className="text-[13px] font-semibold text-slate-700">
                          {event.price}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ── Separator ── */}
                  <div className="mx-5 border-t border-slate-100" />

                  {/* ── Action buttons ── */}
                  <div className="grid grid-cols-2 gap-2 px-5 pt-3 pb-5">
                    <button
                      onClick={() => togglePanel(ticket.id, "payment")}
                      className={`flex items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-medium transition-colors ${
                        openPanel === "payment"
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                      }`}
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      Payment
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform duration-200 ${
                          openPanel === "payment" ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => togglePanel(ticket.id, "qr")}
                      className={`flex items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-medium transition-colors ${
                        openPanel === "qr"
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                      }`}
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      QR Code
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform duration-200 ${
                          openPanel === "qr" ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {/* ── Expanded panels ── */}
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