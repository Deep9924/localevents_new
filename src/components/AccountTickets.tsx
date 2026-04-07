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
import { jsPDF } from "jspdf";
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
          <div className="flex items-center gap-4 mb-6">
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
      <div className="max-w-3xl mx-auto px-4 py-8">
        {ticketsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-white rounded-2xl animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Ticket className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {filterType === "upcoming" ? "No upcoming tickets" : "No past tickets"}
            </h3>
            <p className="text-slate-500 mb-6">Time to discover some amazing events!</p>
            <Button
              onClick={() => router.push("/")}
              className="bg-indigo-600 hover:bg-indigo-700 px-8 rounded-full"
            >
              Explore Events
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticketItem: TicketWithNonNullEvent) => {
              const event = ticketItem.event;
              const isExpanded = expandedTicket === ticketItem.id;

              return (
                <div key={ticketItem.id} className="group">
                  <Card className={`overflow-hidden border-slate-200 transition-all duration-300 ${
                    isExpanded ? "ring-2 ring-indigo-500 shadow-xl" : "hover:shadow-md"
                  }`}>
                    <div className="p-4 sm:p-5">
                      <div className="flex gap-4">
                        {/* Event Image */}
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-100">
                          <img
                            src={event.image || "/placeholder-event.jpg"}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Event Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-tight line-clamp-1">
                              {event.title}
                            </h3>
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md whitespace-nowrap">
                              x{ticketItem.quantity}
                            </span>
                          </div>
                          
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-slate-500 text-xs sm:text-sm">
                              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                              <span>{formatDate(event.date)}</span>
                              <span className="w-1 h-1 bg-slate-300 rounded-full" />
                              <Clock className="w-3.5 h-3.5 text-indigo-500" />
                              <span>{formatTime(event.time)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 text-xs sm:text-sm">
                              <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                              <span className="truncate">{event.venue}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions Row */}
                      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setExpandedTicket(isExpanded ? null : ticketItem.id)}
                            variant="ghost"
                            size="sm"
                            className={`rounded-full px-4 ${isExpanded ? "bg-indigo-50 text-indigo-600" : "text-slate-600"}`}
                          >
                            <QrCode className="w-4 h-4 mr-2" />
                            {isExpanded ? "Hide Code" : "Show Code"}
                            {isExpanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                          </Button>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            onClick={() => router.push(`/${event.citySlug}/${event.slug}`)}
                            variant="ghost"
                            size="sm"
                            className="text-slate-600 hover:text-indigo-600 rounded-full"
                          >
                            Details
                          </Button>
                          <Button
                            onClick={() => downloadTicket(ticketItem)}
                            variant="outline"
                            size="sm"
                            className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-full px-4"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Ticket Section */}
                    {isExpanded && (
                      <div className="bg-slate-50 border-t border-slate-100 p-6 sm:p-8 flex flex-col items-center animate-in slide-in-from-top-2 duration-300">
                        {/* This hidden div is used for PDF generation */}
                        <div 
                          ref={(el) => { ticketRefs.current[ticketItem.id] = el; }}
                          className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center w-full max-w-sm"
                        >
                          <div className="text-center mb-6">
                            <h4 className="text-xl font-black text-slate-900 mb-1 uppercase tracking-tight">Entry Pass</h4>
                            <p className="text-slate-500 text-sm font-medium">Order #{ticketItem.id}</p>
                          </div>
                          
                          <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 mb-6">
                            <QRCodeSVG 
                              value={`TICKET-${ticketItem.id}-${user.id}`} 
                              size={180}
                              level="H"
                              includeMargin={false}
                            />
                          </div>

                          <div className="w-full space-y-4">
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                              <span className="text-slate-400 text-xs font-bold uppercase">Event</span>
                              <span className="text-slate-900 text-sm font-bold text-right">{event.title}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                              <span className="text-slate-400 text-xs font-bold uppercase">Date</span>
                              <span className="text-slate-900 text-sm font-bold">{formatDate(event.date)}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                              <span className="text-slate-400 text-xs font-bold uppercase">Holder</span>
                              <span className="text-slate-900 text-sm font-bold">{user.name || "Guest"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400 text-xs font-bold uppercase">Quantity</span>
                              <span className="text-slate-900 text-sm font-bold">{ticketItem.quantity} Person(s)</span>
                            </div>
                          </div>

                          <div className="mt-8 pt-6 border-t-2 border-dashed border-slate-200 w-full text-center">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Scan at the entrance</p>
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
