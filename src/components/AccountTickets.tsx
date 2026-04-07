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
  Download,
  QrCode,
  CheckCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useMemo, useRef } from "react";
import { formatDate, formatTime } from "@/lib/utils";
import type { AppRouter } from "@/server/routers";
import type { inferRouterOutputs } from "@trpc/server";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import { toast } from "sonner";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type TicketWithEvent = RouterOutputs["tickets"]["list"][number];
type TicketWithNonNullEvent = TicketWithEvent & {
  event: NonNullable<TicketWithEvent["event"]>;
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
  if (isNaN(eventDate.getTime())) {
    console.warn("Invalid date:", dateStr);
    return new Date();
  }
  return eventDate;
};

export default function AccountTickets() {
  const { user, loading: authLoading, isAuthenticated } = useAuth({
    redirectOnUnauthenticated: true,
  });
  const router = useRouter();
  const [filterType, setFilterType] = useState<FilterType>("upcoming");
  const [expandedTicket, setExpandedTicket] = useState<number | null>(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState<number | null>(null);
  const ticketRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const { data: tickets = [], isLoading: ticketsLoading } =
    trpc.tickets.list.useQuery(undefined, { enabled: !!user });

  const filteredTickets = useMemo(() => {
    const now = new Date();
    const validTickets = tickets.filter(
      (item: TicketWithEvent): item is TicketWithNonNullEvent =>
        item.event !== null
    );

    if (filterType === "upcoming") {
      return validTickets
        .filter((item: TicketWithNonNullEvent) => {
          const eventDate = parseEventDate(item.event.date, item.event.time);
          return eventDate >= now;
        })
        .sort((a: TicketWithNonNullEvent, b: TicketWithNonNullEvent) => {
          return (
            parseEventDate(a.event.date, a.event.time).getTime() -
            parseEventDate(b.event.date, b.event.time).getTime()
          );
        });
    }

    return validTickets
      .filter((item: TicketWithNonNullEvent) => {
        const eventDate = parseEventDate(item.event.date, item.event.time);
        return eventDate < now;
      })
      .sort((a: TicketWithNonNullEvent, b: TicketWithNonNullEvent) => {
        return (
          parseEventDate(b.event.date, b.event.time).getTime() -
          parseEventDate(a.event.date, a.event.time).getTime()
        );
      });
  }, [tickets, filterType]);

  const downloadTicket = async (ticket: TicketWithNonNullEvent) => {
    const element = ticketRefs.current[ticket.id];
    if (!element) {
      toast.error("Ticket element not found");
      return;
    }
    try {
      toast.info("Generating your ticket PDF...");
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        allowTaint: true,
      });
      const imgData = canvas.toDataURL("image/png");
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      pdf.save(`Ticket-${ticket.event.title.replace(/\s+/g, "-")}-${ticket.id}.pdf`);
      toast.success("Ticket downloaded!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to download ticket.");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.push("/account/profile")}
              className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
            </button>
            <h1 className="text-lg font-semibold text-slate-900">My Tickets</h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-slate-100">
            {(["upcoming", "past"] as const).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setFilterType(type);
                  setExpandedTicket(null);
                  setShowPaymentDetails(null);
                }}
                className={`pb-3 text-sm transition-all border-b-2 -mb-px ${
                  filterType === type
                    ? "border-indigo-600 text-indigo-600 font-medium"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                {type === "upcoming" ? "Upcoming" : "Past Events"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-5">
        {ticketsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-white rounded-xl animate-pulse border border-slate-100"
              />
            ))}
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Ticket className="w-5 h-5 text-slate-300" />
            </div>
            <p className="text-sm text-slate-500 mb-4">
              {filterType === "upcoming"
                ? "No upcoming tickets yet"
                : "No past events"}
            </p>
            {filterType === "upcoming" && (
              <button
                onClick={() => router.push("/")}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Browse events →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((ticketItem: TicketWithNonNullEvent) => {
              const event = ticketItem.event;
              const isExpanded = expandedTicket === ticketItem.id;
              const showPayment = showPaymentDetails === ticketItem.id;
              const isPast = filterType === "past";

              return (
                <div key={ticketItem.id}>
                  <div
                    className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden ${
                      isExpanded
                        ? "border-indigo-200 shadow-sm"
                        : "border-slate-100 hover:border-slate-200"
                    } ${isPast ? "opacity-70" : ""}`}
                  >
                    {/* Main ticket row */}
                    <div className="flex gap-3 p-4">
                      {/* Image */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                        <img
                          src={event.image || "/placeholder-event.jpg"}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="text-sm font-medium text-slate-900 truncate">
                              {event.title}
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {event.city} · {event.category}
                            </p>
                          </div>
                          {isPast ? (
                            <span className="text-xs text-slate-400 flex-shrink-0">Past</span>
                          ) : (
                            <span className="flex items-center gap-1 flex-shrink-0">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-xs text-emerald-600">Confirmed</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(event.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(event.time)}
                          </span>
                          <span className="ml-auto text-slate-600 font-medium">
                            {ticketItem.currency} {Number(ticketItem.total).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action strip */}
                    <div className="flex items-center gap-1 px-4 pb-3">
                      <button
                        onClick={() =>
                          setExpandedTicket(isExpanded ? null : ticketItem.id)
                        }
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md transition-colors ${
                          isExpanded
                            ? "bg-indigo-50 text-indigo-600"
                            : "text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        <QrCode className="w-3 h-3" />
                        QR Code
                      </button>

                      <button
                        onClick={() =>
                          setShowPaymentDetails(showPayment ? null : ticketItem.id)
                        }
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md transition-colors ${
                          showPayment
                            ? "bg-slate-100 text-slate-700"
                            : "text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        Receipt
                      </button>

                      <div className="ml-auto flex items-center gap-1">
                        <button
                          onClick={() =>
                            router.push(`/${event.citySlug}/${event.slug}`)
                          }
                          className="text-xs text-slate-400 hover:text-slate-600 px-2.5 py-1.5 rounded-md hover:bg-slate-50 transition-colors"
                        >
                          View event
                        </button>
                        <button
                          onClick={() => downloadTicket(ticketItem)}
                          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-2.5 py-1.5 rounded-md hover:bg-slate-50 transition-colors border border-slate-100"
                        >
                          <Download className="w-3 h-3" />
                          PDF
                        </button>
                      </div>
                    </div>

                    {/* Payment details */}
                    {showPayment && (
                      <div className="mx-4 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-500 space-y-2">
                        <div className="flex justify-between">
                          <span>Order</span>
                          <span className="text-slate-700">#{ticketItem.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Qty</span>
                          <span className="text-slate-700">
                            {ticketItem.quantity} ticket{ticketItem.quantity > 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total</span>
                          <span className="text-slate-700">
                            {ticketItem.currency} {Number(ticketItem.total).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-slate-200">
                          <span>Purchased</span>
                          <span className="text-slate-700">
                            {new Date(ticketItem.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* QR Code panel */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 p-6 flex justify-center bg-slate-50">
                        <div
                          ref={(el) => {
                            ticketRefs.current[ticketItem.id] = el;
                          }}
                          className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col items-center w-full max-w-xs"
                        >
                          <p className="text-xs text-slate-400 mb-1">Entry Pass</p>
                          <p className="text-sm font-medium text-slate-900 mb-4 text-center">
                            {event.title}
                          </p>

                          <div className="p-3 border border-slate-100 rounded-lg mb-4">
                            <QRCodeSVG
                              value={`TICKET-${ticketItem.id}-${user.id}`}
                              size={140}
                              level="H"
                              includeMargin={false}
                            />
                          </div>

                          <div className="w-full space-y-2 text-xs">
                            {[
                              ["Date", `${formatDate(event.date)} · ${formatTime(event.time)}`],
                              ["Holder", user.name || "Guest"],
                              ["Qty", String(ticketItem.quantity)],
                              ["Venue", event.venue],
                            ].map(([label, value]) => (
                              <div
                                key={label}
                                className="flex justify-between text-slate-500"
                              >
                                <span>{label}</span>
                                <span className="text-slate-800 text-right max-w-[60%] truncate">
                                  {value}
                                </span>
                              </div>
                            ))}
                          </div>

                          <p className="mt-5 text-[10px] tracking-widest text-slate-300 uppercase">
                            Scan at entrance
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
