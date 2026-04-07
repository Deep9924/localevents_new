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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useMemo, useRef } from "react";
import { formatDate, formatTime } from "@/lib/utils";
import type { AppRouter } from "@/server/routers";
import type { inferRouterOutputs } from "@trpc/server";
import { QRCodeSVG } from "qrcode.react";
// jsPDF is imported dynamically to avoid SSR issues
import html2canvas from "html2canvas";
import { toast } from "sonner";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type TicketWithEvent = RouterOutputs["tickets"]["list"][number];
type TicketWithNonNullEvent = TicketWithEvent & {
  event: NonNullable<TicketWithEvent["event"]>;
};

type FilterType = "upcoming" | "past";

export default function AccountTickets() {
  const { user, loading: authLoading, isAuthenticated } = useAuth({
    redirectOnUnauthenticated: true,
  });
  const router = useRouter();
  const [filterType, setFilterType] = useState<FilterType>("upcoming");
  const [expandedTicket, setExpandedTicket] = useState<number | null>(null);
  const ticketRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const {
    data: tickets = [],
    isLoading: ticketsLoading,
  } = trpc.tickets.list.useQuery(undefined, {
    enabled: isAuthenticated && !!user,
  });

  const filteredTickets = useMemo(() => {
    const now = new Date();
    const validTickets = tickets.filter(
      (item: TicketWithEvent): item is TicketWithNonNullEvent =>
        item.event !== null
    );

    let filtered = validTickets.filter((item: TicketWithNonNullEvent) => {
      const eventDate = new Date(`${item.event.date}T${item.event.time || "00:00"}`);
      return filterType === "upcoming" ? eventDate >= now : eventDate < now;
    });

    return filtered.sort(
      (a: TicketWithNonNullEvent, b: TicketWithNonNullEvent) =>
        new Date(`${b.event.date}T${b.event.time || "00:00"}`).getTime() -
        new Date(`${a.event.date}T${a.event.time || "00:00"}`).getTime()
    );
  }, [tickets, filterType]);

  const downloadTicket = async (ticket: TicketWithNonNullEvent) => {
    const element = ticketRefs.current[ticket.id];
    if (!element) return;

    try {
      toast.info("Generating your ticket PDF...");
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });
      
      const imgData = canvas.toDataURL("image/png");
      
      // Dynamically import jsPDF to avoid SSR issues with fflate/node-worker
      const { jsPDF } = await import("jspdf");
      
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width / 2, canvas.height / 2],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
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

          {/* Simplified Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl">
            {(["upcoming", "past"] as const).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setFilterType(type);
                  setExpandedTicket(null);
                }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  filterType === type
                    ? "bg-white text-indigo-600 shadow-sm"
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
      <div className="max-w-3xl mx-auto px-4 py-6">
        {ticketsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white rounded-xl animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Ticket className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {filterType === "upcoming" ? "No upcoming tickets" : "No past tickets"}
            </h3>
            <p className="text-slate-500 text-sm mb-5">Time to discover some amazing events!</p>
            <Button
              onClick={() => router.push("/")}
              className="bg-indigo-600 hover:bg-indigo-700 px-6 rounded-full text-sm"
            >
              Explore Events
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((ticketItem: TicketWithNonNullEvent) => {
              const event = ticketItem.event;
              const isExpanded = expandedTicket === ticketItem.id;

              return (
                <div key={ticketItem.id}>
                  <Card className={`overflow-hidden border-slate-200 transition-all duration-300 ${
                    isExpanded ? "ring-2 ring-indigo-500 shadow-lg" : "hover:shadow-md"
                  }`}>
                    <div className="p-3 sm:p-4">
                      <div className="flex gap-3">
                        {/* Event Image */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-100">
                          <img
                            src={event.image || "/placeholder-event.jpg"}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Event Info */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm leading-tight line-clamp-1">
                              {event.title}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {event.city} • {event.category}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-600 mt-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-indigo-500" />
                              <span>{formatDate(event.date)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-indigo-500" />
                              <span>{formatTime(event.time)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Quantity Badge */}
                        <div className="flex flex-col items-end justify-between">
                          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                            x{ticketItem.quantity}
                          </span>
                          <span className="text-xs font-semibold text-slate-900">
                            {ticketItem.currency} {Number(ticketItem.total).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Actions Row */}
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <Button
                          onClick={() => setExpandedTicket(isExpanded ? null : ticketItem.id)}
                          variant="ghost"
                          size="sm"
                          className={`rounded-lg px-3 py-1.5 h-auto text-xs font-medium ${isExpanded ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-100"}`}
                        >
                          <QrCode className="w-3.5 h-3.5 mr-1.5" />
                          {isExpanded ? "Hide" : "Show"} Code
                          {isExpanded ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                        </Button>
                        
                        <div className="flex gap-2">
                          <Button
                            onClick={() => router.push(`/${event.citySlug}/${event.slug}`)}
                            variant="ghost"
                            size="sm"
                            className="text-slate-600 hover:text-indigo-600 rounded-lg h-auto px-3 py-1.5 text-xs font-medium"
                          >
                            Details
                          </Button>
                          <Button
                            onClick={() => downloadTicket(ticketItem)}
                            variant="outline"
                            size="sm"
                            className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg h-auto px-3 py-1.5 text-xs font-medium"
                          >
                            <Download className="w-3.5 h-3.5 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Ticket Section */}
                    {isExpanded && (
                      <div className="bg-slate-50 border-t border-slate-100 p-4 sm:p-6 flex flex-col items-center animate-in slide-in-from-top-2 duration-300">
                        {/* This hidden div is used for PDF generation */}
                        <div 
                          ref={(el) => { ticketRefs.current[ticketItem.id] = el; }}
                          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center w-full max-w-sm"
                        >
                          <div className="text-center mb-4">
                            <h4 className="text-lg font-black text-slate-900 mb-0.5 uppercase tracking-tight">Entry Pass</h4>
                            <p className="text-slate-500 text-xs font-medium">Order #{ticketItem.id}</p>
                          </div>
                          
                          <div className="bg-white p-3 rounded-xl border-2 border-slate-100 mb-4">
                            <QRCodeSVG 
                              value={`TICKET-${ticketItem.id}-${user.id}`} 
                              size={140}
                              level="H"
                              includeMargin={false}
                            />
                          </div>

                          <div className="w-full space-y-2 text-xs">
                            <div className="flex justify-between border-b border-slate-100 pb-1.5">
                              <span className="text-slate-400 font-bold uppercase">Event</span>
                              <span className="text-slate-900 font-semibold text-right">{event.title}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-1.5">
                              <span className="text-slate-400 font-bold uppercase">Date</span>
                              <span className="text-slate-900 font-semibold">{formatDate(event.date)}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-1.5">
                              <span className="text-slate-400 font-bold uppercase">Holder</span>
                              <span className="text-slate-900 font-semibold">{user.name || "Guest"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400 font-bold uppercase">Qty</span>
                              <span className="text-slate-900 font-semibold">{ticketItem.quantity}</span>
                            </div>
                          </div>

                          <div className="mt-5 pt-4 border-t-2 border-dashed border-slate-200 w-full text-center">
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Scan at entrance</p>
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
