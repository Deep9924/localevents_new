"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import QRCode from "react-qr-code";
import { CalendarDays, ChevronDown, ChevronUp, MapPin, Receipt, Ticket } from "lucide-react";

import { api } from "~/trpc/react";

type TicketEvent = {
  id: string | number;
  slug: string;
  title: string;
  image?: string | null;
  date?: string | Date | null;
  time?: string | null;
  venue?: string | null;
  city?: string | null;
  citySlug?: string | null;
  category?: string | null;
};

type TicketItem = {
  id: number;
  userId: number;
  eventId: string | number;
  quantity?: number | null;
  currency?: string | null;
  total?: string | number | null;
  status?: "confirmed" | "cancelled" | "refunded" | string | null;
  createdAt?: string | Date | null;
  event?: TicketEvent | null;
};

function formatEventDate(date: string | Date | null | undefined) {
  if (!date) return "Date TBD";

  const parsed = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(parsed.getTime())) return "Date TBD";

  return parsed.toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPurchaseDate(date: string | Date | null | undefined) {
  if (!date) return "Unknown";
  const parsed = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(parsed.getTime())) return "Unknown";

  return parsed.toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMoney(
  value: string | number | null | undefined,
  currency: string | null | undefined,
) {
  const amount =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : 0;

  if (Number.isNaN(amount)) return `${currency ?? "CAD"} 0.00`;

  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: currency || "CAD",
  }).format(amount);
}

function getTicketCount(ticket: TicketItem) {
  if (typeof ticket.quantity === "number" && Number.isFinite(ticket.quantity)) {
    return Math.max(1, ticket.quantity);
  }
  return 1;
}

function getTicketStatusClasses(status?: string | null) {
  switch (status) {
    case "confirmed":
      return "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/20";
    case "cancelled":
      return "bg-red-500/15 text-red-300 ring-1 ring-red-500/20";
    case "refunded":
      return "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/20";
    default:
      return "bg-white/10 text-slate-300 ring-1 ring-white/10";
  }
}

export default function AccountTickets() {
  const [openTicketId, setOpenTicketId] = useState<number | null>(null);

  const { data, isLoading } = api.tickets.list.useQuery();

  const tickets = useMemo(() => {
    return ((data ?? []) as TicketItem[]).filter((ticket) => ticket.event);
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-white/10 bg-[#111827] shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
          >
            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
              <div className="h-44 w-full animate-pulse rounded-xl bg-white/10 sm:h-36 sm:w-48" />
              <div className="flex-1 space-y-3">
                <div className="h-5 w-2/3 animate-pulse rounded bg-white/10" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-white/10" />
                <div className="h-4 w-1/3 animate-pulse rounded bg-white/10" />
                <div className="mt-4 flex gap-2">
                  <div className="h-10 w-28 animate-pulse rounded-lg bg-white/10" />
                  <div className="h-10 w-24 animate-pulse rounded-lg bg-white/10" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!tickets.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#111827] p-8 text-center shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/5">
          <Ticket className="h-7 w-7 text-slate-300" />
        </div>
        <h3 className="text-lg font-semibold text-white">No tickets yet</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
          Once you purchase an event ticket, it will appear here with event details, purchase info,
          and a scannable QR code.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => {
        const event = ticket.event;
        if (!event) return null;

        const isOpen = openTicketId === ticket.id;
        const ticketCount = getTicketCount(ticket);
        const eventHref = `/${event.citySlug ?? "events"}/${event.slug}`;

        const qrItems = Array.from({ length: ticketCount }).map((_, index) => {
          const itemNumber = index + 1;
          const code = `TKT-${ticket.id}-${itemNumber.toString().padStart(2, "0")}`;
          const qrValue = `ticket:${ticket.id}:item:${itemNumber}:user:${ticket.userId}:event:${ticket.eventId}:status:${ticket.status ?? "confirmed"}`;

          return {
            id: `${ticket.id}-${itemNumber}-${event.slug}`,
            code,
            qrValue,
            label: `Ticket ${itemNumber}`,
          };
        });

        return (
          <div
            key={ticket.id}
            className="overflow-hidden rounded-2xl border border-white/10 bg-[#111827] shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
          >
            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
              <div className="relative h-44 w-full overflow-hidden rounded-xl bg-slate-900 sm:h-36 sm:w-48 sm:flex-shrink-0">
                {event.image ? (
                  <Image
                    src={event.image}
                    alt={event.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 192px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-white/5 text-slate-500">
                    <Ticket className="h-8 w-8" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="mb-2 inline-flex rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300">
                      {event.category ?? "Event"}
                    </p>
                    <h3 className="line-clamp-2 text-lg font-semibold text-white sm:text-xl">
                      {event.title}
                    </h3>
                  </div>

                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getTicketStatusClasses(ticket.status)}`}
                  >
                    {ticket.status ?? "confirmed"}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-400">
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-slate-500" />
                    {formatEventDate(event.date)}
                    {event.time ? ` • ${event.time}` : ""}
                  </span>

                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-500" />
                    {event.venue ?? "Venue TBD"}
                    {event.city ? ` • ${event.city}` : ""}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-lg bg-white/5 px-3 py-2 text-slate-300">
                    {ticketCount} {ticketCount === 1 ? "ticket" : "tickets"}
                  </span>
                  <span className="rounded-lg bg-white/5 px-3 py-2 text-slate-300">
                    {formatMoney(ticket.total, ticket.currency)}
                  </span>
                  <span className="rounded-lg bg-white/5 px-3 py-2 text-slate-400">
                    Purchased {formatPurchaseDate(ticket.createdAt)}
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setOpenTicketId(isOpen ? null : ticket.id)}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-400"
                  >
                    {isOpen ? "Hide tickets" : "View tickets"}
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  <Link
                    href={eventHref}
                    className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                  >
                    View event
                  </Link>
                </div>
              </div>
            </div>

            {isOpen ? (
              <div className="border-t border-white/10 bg-black/20 p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">
                      Ticket details
                    </h4>
                    <p className="mt-1 text-sm text-slate-400">
                      Present the QR code at entry. One code is shown for each ticket in the order.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {qrItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/10 bg-[#0b1220] p-4"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white">{item.label}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                            {item.code}
                          </p>
                        </div>

                        <div className="inline-flex self-start rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/20">
                          Valid for entry
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="rounded-2xl bg-white p-3">
                          <QRCode
                            value={item.qrValue}
                            size={132}
                            bgColor="#FFFFFF"
                            fgColor="#111827"
                            viewBox="0 0 256 256"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="space-y-2 text-sm text-slate-300">
                            <p className="line-clamp-2 font-medium text-white">{event.title}</p>
                            <p>{formatEventDate(event.date)}{event.time ? ` • ${event.time}` : ""}</p>
                            <p>{event.venue ?? "Venue TBD"}{event.city ? ` • ${event.city}` : ""}</p>
                          </div>

                          <div className="mt-4 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
                            <div className="rounded-xl bg-white/5 px-3 py-2">
                              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                                Status
                              </p>
                              <p className="mt-1 capitalize text-slate-200">
                                {ticket.status ?? "confirmed"}
                              </p>
                            </div>
                            <div className="rounded-xl bg-white/5 px-3 py-2">
                              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                                Purchase date
                              </p>
                              <p className="mt-1 text-slate-200">
                                {formatPurchaseDate(ticket.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-[#0b1220] p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-slate-400" />
                    <h5 className="text-sm font-semibold text-white">Purchase summary</h5>
                  </div>

                  <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl bg-white/5 px-3 py-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                        Order ID
                      </p>
                      <p className="mt-1 font-medium text-slate-200">#{ticket.id}</p>
                    </div>

                    <div className="rounded-xl bg-white/5 px-3 py-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                        Quantity
                      </p>
                      <p className="mt-1 font-medium text-slate-200">{ticketCount}</p>
                    </div>

                    <div className="rounded-xl bg-white/5 px-3 py-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                        Total paid
                      </p>
                      <p className="mt-1 font-medium text-slate-200">
                        {formatMoney(ticket.total, ticket.currency)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white/5 px-3 py-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                        Currency
                      </p>
                      <p className="mt-1 font-medium text-slate-200">
                        {ticket.currency ?? "CAD"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
      }
