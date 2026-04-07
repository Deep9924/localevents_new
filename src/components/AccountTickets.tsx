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
  ChevronDown,
  ChevronUp,
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

// Moved outside component to avoid TDZ error when bundler minifies
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

  const {
    data: tickets = [],
    isLoading: ticketsLoading,
  } = trpc.tickets.list.useQuery(undefined, {
    enabled: !!user,
  });

  const filteredTickets = useMemo(() => {
    const now = new Date();
    const validTickets = tickets.filter(
      (item: TicketWithEvent): item is TicketWithNonNullEvent =>
        item.event !== null
    );

    if (filterType === "upcoming") {
      return validTickets.sort(
        (a: TicketWithNonNullEvent, b: TicketWithNonNullEvent) => {
          const dateA = parseEventDate(a.event.date, a.event.time);
          const dateB = parseEventDate(b.event.date, b.event.time);
          return dateA.getTime() - dateB.getTime();
        }
      );
    }

    let filtered = validTickets.filter((item: TicketWithNonNullEvent) => {
      const eventDate = parseEventDate(item.event.date, item.event.time);
      return eventDate < now;
    });

    return filtered.sort(
      (a: TicketWithNonNullEvent, b: TicketWithNonNullEvent) => {
        const dateA = parseEventDate(a.event.date, a.event.time);
        const dateB = parseEventDate(b.event.date, b.event.time);
        return dateB.getTime() - dateA.getTime();
      }
    );
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

      const pdfWidth = 210;
      const pdfHeight = 297;
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      pdf.save(`Ticket-${ticket.event.title.replace(/\s+/g, "-")}-${ticket.id}.pdf`);
      toast.success("Ticket downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to download ticket. Please try again.");
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-5">
            <button
              onClick={() => router.push("/account/profile")}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h1 className="text-2xl font-bold text-slate-900">My Tickets</h1>
          </div>

          {/* Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-lg">
            {(["upcoming", "past"] as const).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setFilterType(type);
                  setExpandedTicket(null);
                  setShowPaymentDetails(null);
                }}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${
                  filterType === type
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {type === "upcoming" ? "Upcoming" : "Past Events"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {ticketsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-white rounded-lg animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Ticket className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              {filterType === "upcoming" ? "No upcoming tickets" : "No past tickets"}
            </h3>
            <p className="text-slate-500 text-sm mb-5">Time to discover some amazing events!</p>
            <Button
              onClick={() => router.push("/")}
              className="bg-indigo-600 hover:bg-indigo-700 px-6 rounded-lg text-sm"
            >
              Explore Events
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((ticketItem: TicketWithNonNullEvent) => {
              const event = ticketItem.event;
              const isExpanded = expandedTicket === ticketItem.id;
              const showPayment = showPaymentDetails === ticketItem.id;

              return (
                <div key={ticketItem.id}>
                  <Card className={`overflow-hidden border-slate-200 transition-all duration-200 ${
                    isExpanded ? "ring-2 ring-indigo-400 shadow-md" : "hover:shadow-sm"
                  }`}>
                    <div className="p-4">
                      <div className="flex gap-4">
                        {/* Event Image */}
                        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-200">
                          <img
                            src={event.image || "/placeholder-event.jpg"}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Event Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0">
                              <h3 className="font-semibold text-slate-900 text-sm line-clamp-1">
                                {event.title}
                              </h3>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {event.city} • {event.category}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-xs font-medium text-green-700">Paid</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-slate-600 mb-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{formatDate(event.date)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{formatTime(event.time)}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-slate-600">Qty:</span>
                              <span className="text-xs font-semibold text-slate-900">{ticketItem.quantity}</span>
                            </div>
                            <span className="text-sm font-semibold text-slate-900">
                              {ticketItem.currency} {Number(ticketItem.total).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions Row */}
                      <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap items-center gap-2">
                        <Button
                          onClick={() => setExpandedTicket(isExpanded ? null : ticketItem.id)}
                          variant="ghost"
                          size="sm"
                          className={`rounded-md px-3 py-1.5 h-auto text-xs font-medium ${isExpanded ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"}`}
                        >
                          <QrCode className="w-3.5 h-3.5 mr-1.5" />
                          {isExpanded ? "Hide" : "Show"} QR Code
                        </Button>

                        <Button
                          onClick={() => setShowPaymentDetails(showPayment ? null : ticketItem.id)}
                          variant="ghost"
                          size="sm"
                          className={`rounded-md px-3 py-1.5 h-auto text-xs font-medium ${showPayment ? "bg-slate-200 text-slate-700" : "text-slate-600 hover:bg-slate-100"}`}
                        >
                          Payment Details
                        </Button>

                        <div className="ml-auto flex gap-2">
                          <Button
                            onClick={() => router.push(`/${event.citySlug}/${event.slug}`)}
                            variant="ghost"
                            size="sm"
                            className="text-slate-600 hover:text-slate-900 rounded-md h-auto px-3 py-1.5 text-xs font-medium"
                          >
                            Details
                          </Button>
                          <Button
                            onClick={() => downloadTicket(ticketItem)}
                            variant="outline"
                            size="sm"
                            className="border-slate-200 text-slate-700 hover:bg-slate-100 rounded-md h-auto px-3 py-1.5 text-xs font-medium"
                          >
                            <Download className="w-3.5 h-3.5 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>

                      {/* Payment Details Section */}
                      {showPayment && (
                        <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 animate-in slide-in-from-top-2 duration-200">
                          <h4 className="text-sm font-semibold text-slate-900 mb-3">Payment Details</h4>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-slate-600">Order ID:</span>
                              <span className="font-medium text-slate-900">#{ticketItem.id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Status:</span>
                              <span className="inline-flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-green-600" />
                                <span className="font-medium text-green-700 capitalize">{ticketItem.status}</span>
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Amount:</span>
                              <span className="font-medium text-slate-900">{ticketItem.currency} {Number(ticketItem.total).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Quantity:</span>
                              <span className="font-medium text-slate-900">{ticketItem.quantity} ticket{ticketItem.quantity > 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-slate-200">
                              <span className="text-slate-600">Purchased:</span>
                              <span className="font-medium text-slate-900">{new Date(ticketItem.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Expandable QR Code Section */}
                    {isExpanded && (
                      <div className="bg-slate-50 border-t border-slate-200 p-6 flex flex-col items-center animate-in slide-in-from-top-2 duration-200">
                        <div
                          ref={(el) => { ticketRefs.current[ticketItem.id] = el; }}
                          className="bg-white p-8 rounded-lg shadow-sm border border-slate-300 flex flex-col items-center w-full max-w-sm"
                        >
                          <div className="text-center mb-6">
                            <h4 className="text-xl font-bold text-slate-900 mb-1">Entry Pass</h4>
                            <p className="text-slate-500 text-sm">Order #{ticketItem.id}</p>
                          </div>

                          <div className="bg-slate-50 p-4 rounded-lg border-2 border-slate-300 mb-6">
                            <QRCodeSVG
                              value={`TICKET-${ticketItem.id}-${user.id}`}
                              size={160}
                              level="H"
                              includeMargin={true}
                            />
                          </div>

                          <div className="w-full space-y-3 text-sm">
                            <div className="flex justify-between border-b border-slate-200 pb-2">
                              <span className="text-slate-600 font-semibold">Event</span>
                              <span className="text-slate-900 font-semibold text-right">{event.title}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-200 pb-2">
                              <span className="text-slate-600 font-semibold">Date & Time</span>
                              <span className="text-slate-900 font-semibold text-right">{formatDate(event.date)} at {formatTime(event.time)}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-200 pb-2">
                              <span className="text-slate-600 font-semibold">Holder</span>
                              <span className="text-slate-900 font-semibold">{user.name || "Guest"}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-200 pb-2">
                              <span className="text-slate-600 font-semibold">Quantity</span>
                              <span className="text-slate-900 font-semibold">{ticketItem.quantity}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600 font-semibold">Venue</span>
                              <span className="text-slate-900 font-semibold text-right">{event.venue}</span>
                            </div>
                          </div>

                          <div className="mt-6 pt-4 border-t-2 border-dashed border-slate-300 w-full text-center">
                            <p className="text-xs text-slate-500 font-semibold tracking-wider">SCAN AT ENTRANCE</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
