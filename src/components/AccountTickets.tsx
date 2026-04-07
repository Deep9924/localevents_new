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
  ChevronDown,
  QrCode,
  CreditCard,
  Receipt,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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

function getPaymentAmount(
  ticket: TicketItem,
  eventPrice?: string | null
): string {
  if (
    "amount" in ticket &&
    typeof (ticket as Record<string, unknown>).amount === "string"
  ) {
    return (ticket as Record<string, unknown>).amount as string;
  }

  if (
    "total" in ticket &&
    typeof (ticket as Record<string, unknown>).total === "string"
  ) {
    return (ticket as Record<string, unknown>).total as string;
  }

  return eventPrice || "Paid";
}

function getPaymentMethod(ticket: TicketItem): string {
  if (
    "paymentMethod" in ticket &&
    typeof (ticket as Record<string, unknown>).paymentMethod === "string"
  ) {
    return (ticket as Record<string, unknown>).paymentMethod as string;
  }
  return "Card payment";
}

function getPurchaseDate(ticket: TicketItem): string {
  if ("createdAt" in ticket && (ticket as Record<string, unknown>).createdAt) {
    const value = (ticket as Record<string, unknown>).createdAt;
    const d = value instanceof Date ? value : new Date(String(value));

    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString();
    }
  }

  return "Recently purchased";
}

function QrCard({ code, label }: { code: string; label: string }) {
  const cells = Array.from({ length: 11 * 11 }, (_, i) => {
    const row = Math.floor(i / 11);
    const col = i % 11;
    const seed = (row * 17 + col * 13 + code.length * 7) % 5;

    const finder =
      (row < 3 && col < 3) ||
      (row < 3 && col > 7) ||
      (row > 7 && col < 3);

    return finder || seed === 0 || (row + col) % 7 === 0;
  });

  return (
    <div className="w-[188px] shrink-0 snap-start rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:w-[210px]">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          {label}
        </p>
        <QrCode className="h-4 w-4 text-slate-400" />
      </div>

      <div className="mx-auto grid w-32 grid-cols-11 gap-[2px] rounded-xl bg-white p-2 ring-1 ring-slate-200 sm:w-36">
        {cells.map((filled, i) => (
          <div
            key={i}
            className={`aspect-square rounded-[1px] ${
              filled ? "bg-slate-900" : "bg-transparent"
            }`}
          />
        ))}
      </div>

      <p className="mt-3 truncate text-center font-mono text-[10px] tracking-wider text-slate-400">
        {code}
      </p>
    </div>
  );
}

function TicketDropdown({
  ticket,
  ticketCode,
  quantity,
}: {
  ticket: TicketItem;
  ticketCode: string;
  quantity: number;
}) {
  const paymentAmount = getPaymentAmount(ticket);
  const paymentMethod = getPaymentMethod(ticket);
  const purchaseDate = getPurchaseDate(ticket);

  return (
    <details className="group rounded-2xl border border-slate-200 bg-slate-50/70 open:bg-slate-50">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:hidden">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">Ticket access</p>
          <p className="text-xs text-slate-500">
            Show QR codes and payment details
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
            {quantity} {quantity === 1 ? "ticket" : "tickets"}
          </span>
          <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
        </div>
      </summary>

      <div className="space-y-4 border-t border-slate-200 px-4 pb-4 pt-4">
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              QR codes
            </p>
            <p className="text-xs text-slate-500">
              Scroll sideways on mobile
            </p>
          </div>

          <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            <div className="flex min-w-max snap-x snap-mandatory gap-3 sm:grid sm:min-w-0 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: quantity }).map((_, i) => (
                <QrCard
                  key={i}
                  code={`${ticketCode}-${String(i + 1).padStart(3, "0")}`}
                  label={`Ticket ${i + 1} of ${quantity}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center gap-2 text-slate-500">
              <CreditCard className="h-4 w-4" />
              <span className="text-xs font-medium">Payment method</span>
            </div>
            <p className="text-sm font-semibold text-slate-900">
              {paymentMethod}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center gap-2 text-slate-500">
              <Receipt className="h-4 w-4" />
              <span className="text-xs font-medium">Amount paid</span>
            </div>
            <p className="text-sm font-semibold text-slate-900">
              {paymentAmount}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center gap-2 text-slate-500">
              <Calendar className="h-4 w-4" />
              <span className="text-xs font-medium">Purchased</span>
            </div>
            <p className="text-sm font-semibold text-slate-900">
              {purchaseDate}
            </p>
          </div>
        </div>
      </div>
    </details>
  );
}

export default function AccountTickets() {
  const { user, loading: authLoading, isAuthenticated } = useAuth({
    redirectOnUnauthenticated: true,
  });

  const router = useRouter();
  const [filterType, setFilterType] = useState<FilterType>("upcoming");

  const { data: tickets = [], isLoading: ticketsLoading } =
    trpc.tickets.list.useQuery(undefined, {
      enabled: !!user,
    });

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
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-4 py-4">
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
                View your tickets, QR codes, and payment details
              </p>
            </div>
          </div>

          <div className="flex rounded-2xl bg-slate-100 p-1 sm:w-fit">
            {(["upcoming", "past"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-all sm:min-w-[140px] ${
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

      <div className="mx-auto max-w-5xl px-4 py-6">
        {ticketsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white"
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
              const quantity = getTicketCount(ticket);
              const ticketCode = `TKT-${String(ticket.id).toUpperCase()}`;
              const paymentAmount = getPaymentAmount(ticket, event.price || null);

              return (
                <Card
                  key={ticket.id}
                  className={`overflow-hidden border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md ${
                    isPast ? "opacity-80" : ""
                  }`}
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                        <img
                          src={event.image || "/placeholder-event.jpg"}
                          alt={event.title}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h3 className="truncate text-base font-semibold text-slate-900">
                              {event.title}
                            </h3>
                            <p className="mt-0.5 text-sm text-slate-500">
                              {event.city} • {event.category}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                              {paymentAmount}
                            </span>
                            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600">
                              {quantity} {quantity === 1 ? "ticket" : "tickets"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500 sm:gap-4">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {formatDate(event.date)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {formatTime(event.time)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                      <button
                        onClick={() =>
                          router.push(`/${event.citySlug}/${event.slug}`)
                        }
                        className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200 hover:text-slate-900"
                      >
                        View details
                      </button>
                    </div>

                    <div className="mt-4">
                      <TicketDropdown
                        ticket={ticket}
                        ticketCode={ticketCode}
                        quantity={quantity}
                      />
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
