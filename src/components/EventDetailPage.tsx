"use client";

import { useRouter } from "next/navigation";
import {
  Calendar, MapPin, Clock, Users, Share2, Bookmark,
  Ticket, ArrowLeft, AlertCircle, Loader2, Tag,
  ExternalLink, Star, ChevronRight, Home, FileText,
  CheckCircle2, AlertTriangle, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Footer from "@/components/Footer";
import { CITIES } from "@/lib/events-data";
import OrganizerProfile from "@/components/OrganizerProfile";
import CalendarButton from "@/components/CalendarButton";
import EventCard from "@/components/EventCard";

interface EventDetailPageProps {
  citySlug?: string;
  eventSlug?: string;
}

function ErrorState({ icon, title, action }: { icon?: React.ReactNode; title: string; action: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <main className="max-w-4xl mx-auto px-4 py-16 text-center">
        {icon}
        <h1 className="text-2xl font-bold text-indigo-900 mb-6">{title}</h1>
        {action}
      </main>
      <Footer />
    </div>
  );
}

function Breadcrumb({ citySlug, cityName, eventTitle }: { citySlug: string; cityName: string; eventTitle: string }) {
  const router = useRouter();
  return (
    <nav className="flex items-center gap-1.5 text-xs text-gray-400 flex-wrap">
      <button onClick={() => router.push("/")} className="flex items-center gap-1 hover:text-indigo-600 transition-colors font-medium">
        <Home className="w-3 h-3" />Home
      </button>
      <ChevronRight className="w-3 h-3 shrink-0" />
      <button onClick={() => router.push(`/${citySlug}`)} className="hover:text-indigo-600 transition-colors font-medium capitalize">
        {cityName}
      </button>
      <ChevronRight className="w-3 h-3 shrink-0" />
      <span className="text-gray-500 font-medium truncate max-w-[180px] sm:max-w-xs">{eventTitle}</span>
    </nav>
  );
}

// ── Compact highlight row — no subtext, no dividers, subtle indigo icon ──────
function HighlightRow({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-indigo-400" />
      </div>
      <p className="text-sm font-semibold text-gray-900 leading-tight">{label}</p>
    </div>
  );
}

export default function EventDetailPage({ citySlug, eventSlug }: EventDetailPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isInterested, setIsInterested] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [citySlug, eventSlug]);

  const { data: event, isLoading: eventLoading } = trpc.events.getBySlug.useQuery(
    { citySlug: citySlug ?? "", eventSlug: eventSlug ?? "" },
    { enabled: !!citySlug && !!eventSlug }
  );

  const { data: savedStatus } = trpc.savedEvents.isSaved.useQuery(
    { eventId: event?.id ?? "" },
    { enabled: !!user && !!event?.id }
  );

  const { data: rawSimilar } = trpc.events.getSimilar.useQuery(
    { eventId: event?.id ?? "", category: event?.category ?? "", citySlug: citySlug ?? "", limit: 8 },
    { enabled: !!event?.id }
  );
  const similarEvents = Array.isArray(rawSimilar) ? rawSimilar : [];

  useEffect(() => {
    if (savedStatus !== undefined) setIsSaved(savedStatus);
  }, [savedStatus]);

  const saveEventMutation = trpc.savedEvents.save.useMutation();
  const unsaveEventMutation = trpc.savedEvents.unsave.useMutation();

  const handleSaveEvent = async () => {
    if (!user || !event) return;
    try {
      if (isSaved) {
        await unsaveEventMutation.mutateAsync({ eventId: event.id });
        setIsSaved(false);
      } else {
        await saveEventMutation.mutateAsync({ eventId: event.id, eventTitle: event.title, eventDate: event.date, eventCity: event.citySlug });
        setIsSaved(true);
      }
    } catch { /* silent */ }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: event?.title, url });
      else await navigator.clipboard.writeText(url);
    } catch { /* silent */ }
  };

  const handleGetTickets = () => {
    // Ticket booking coming soon — no popup
  };

  const city = CITIES.find((c) => c.slug === citySlug);

  if (eventLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
    </div>
  );

  if (!city) return (
    <ErrorState
      icon={<AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />}
      title="City not found"
      action={<Button onClick={() => router.push("/")} className="bg-indigo-700 hover:bg-indigo-800"><ArrowLeft className="w-4 h-4 mr-2" />Back to Home</Button>}
    />
  );

  if (!event) return (
    <ErrorState
      icon={<AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />}
      title="Event not found"
      action={<Button onClick={() => router.push(`/${citySlug}`)} className="bg-indigo-700 hover:bg-indigo-800"><ArrowLeft className="w-4 h-4 mr-2" />Back to {city.name}</Button>}
    />
  );

  const isFree = event.price === "Free" || event.price === null;
  const displayPrice = isFree ? "Free" : event.price;

  // Parse tags
  const tags: string[] = (() => {
    const raw = event.tags;
    if (!raw) return [event.category];
    if (Array.isArray(raw)) return raw;
    const str = String(raw).trim();
    if (str.startsWith("[")) {
      try {
        const parsed = JSON.parse(str);
        if (Array.isArray(parsed)) return parsed.map((t) => String(t).trim()).filter(Boolean);
      } catch { /* fall through */ }
    }
    return str.split(",").map((t) => t.trim()).filter(Boolean);
  })();

  const calendarEvent = {
    title: event.title,
    description: event.description ?? null,
    date: typeof event.date === "string" ? event.date : (event.date as Date).toLocaleDateString("en-CA"),
    time: event.time,
    venue: event.venue,
  };

  // Parse day/month from date string e.g. "Sat, 28 Mar"
  const dateParts = event.date?.split(" ") ?? [];
  const dateDay = dateParts[1] ?? "";
  const dateMonth = dateParts[2] ?? "";

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-24 lg:pb-0">

      {/* Breadcrumb */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-3">
        <Breadcrumb citySlug={citySlug!} cityName={city.name} eventTitle={event.title} />
      </div>

      {/* Hero image — fixed height, never changes */}
      <div className="relative w-full overflow-hidden" style={{ height: 288 }}>
        {!imgError && event.image ? (
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-100 via-amber-50 to-indigo-50 flex items-center justify-center">
            <Calendar className="w-20 h-20 text-indigo-200" />
          </div>
        )}
      </div>

      {/* Title block — sits between image and body, full width */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 pb-1">
        <div className="flex items-center gap-2 text-sm mb-3">
          <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {((event as any).organizerName ?? "L")[0].toUpperCase()}
          </div>
          <span className="font-medium text-gray-600">{(event as any).organizerName ?? "LocalEvents Team"}</span>
          <span className="text-gray-300">·</span>
          <span className="text-xs font-medium text-indigo-500">Verified</span>
        </div>

        <h1
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black leading-tight mb-4"
          style={{ fontFamily: "'Sora', sans-serif" }}
        >
          {event.title}
        </h1>

        {/* Consolidated badges + tags in one row */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-gray-100 text-gray-600 border-0 text-xs capitalize">{event.category}</Badge>
          {event.isFeatured && (
            <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-xs">
              <Star className="w-3 h-3 mr-1 fill-amber-500 text-amber-500 inline" />Featured
            </Badge>
          )}
          {isFree && <Badge className="bg-green-50 text-green-700 border border-green-100 text-xs">Free Entry</Badge>}
          {/* Tags inline with badges */}
          {tags.map((tag) => (
            <span key={tag} className="text-xs font-medium text-gray-500 bg-gray-100 rounded-full px-3 py-0.5 capitalize">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="lg:grid lg:grid-cols-3 lg:gap-10 lg:items-start">

          {/* ══ LEFT COLUMN ════════════════════════════════════════════════ */}
          <div className="lg:col-span-2 space-y-5">

            {/* Highlights — no subtext, no dividers, indigo icon bg */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-1">
              <HighlightRow icon={Calendar} label={event.date} />
              <HighlightRow icon={Clock} label={event.time} />
              <HighlightRow icon={MapPin} label={event.venue} />
              <HighlightRow icon={Tag} label={isFree ? "Free Entry" : `${displayPrice} per person`} />
              {(event.interested ?? 0) > 0 && (
                <HighlightRow icon={Users} label={`${event.interested}+ people interested`} />
              )}
            </div>

            {/* Quick actions — Book Tickets only visible when sidebar is not shown (lg:hidden) */}
            <div className="flex gap-2.5">
              <Button
                onClick={() => setIsInterested((v) => !v)}
                variant={isInterested ? "default" : "outline"}
                className={`flex-1 h-10 font-semibold text-sm ${isInterested ? "bg-indigo-700 hover:bg-indigo-800 text-white" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
              >
                <Users className="w-4 h-4 mr-1.5" />{isInterested ? "Interested" : "I'm Interested"}
              </Button>
              <Button onClick={handleShare} variant="outline" className="flex-1 h-10 border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-sm">
                <Share2 className="w-4 h-4 mr-1.5" />Share
              </Button>
              {/* Only show when sidebar (desktop) is NOT visible */}
              <Button onClick={handleGetTickets} className="lg:hidden flex flex-1 h-10 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold text-sm">
                <Ticket className="w-4 h-4 mr-1.5" />Book Tickets
              </Button>
            </div>

            {/* Date & Location */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100">
                <h2 className="font-semibold text-gray-700 text-xs uppercase tracking-wider">Date &amp; Location</h2>
              </div>

              {/* Date row */}
              <div className="px-5 py-4 flex items-start gap-4 border-b border-gray-100">
                <div className="w-11 h-11 rounded-xl bg-indigo-700 flex flex-col items-center justify-center shrink-0 text-white">
                  <span className="text-[9px] font-bold uppercase leading-none opacity-70">{dateMonth}</span>
                  <span className="text-base font-bold leading-tight">{dateDay}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{event.date} · {event.time}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Approx. 2 hours</p>
                  <div className="mt-2.5 max-w-xs">
                    <CalendarButton event={calendarEvent} />
                  </div>
                </div>
              </div>

              {/* Location row */}
              <div className="px-5 py-4 flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{event.venue}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{city.name}, {city.province}, {city.country}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue} ${city.name}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium mt-2"
                  >
                    View on Google Maps <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-700 text-xs uppercase tracking-wider mb-3">About the event</h2>
              {event.description ? (
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{event.description}</p>
              ) : (
                <p className="text-gray-400 text-sm italic">No description available.</p>
              )}
            </div>

            {/* Terms & Conditions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-gray-400" />
                <h2 className="font-semibold text-gray-700 text-xs uppercase tracking-wider">Terms &amp; Conditions</h2>
              </div>
              <div className="p-5 space-y-4">
                {[
                  { icon: CheckCircle2, color: "text-green-500", title: "Ticket Policy", body: "All ticket sales are final. No refunds or exchanges unless the event is cancelled or rescheduled by the organizer." },
                  { icon: CheckCircle2, color: "text-green-500", title: "Entry Requirements", body: "Valid ID may be required. Tickets must be presented digitally or printed at the door." },
                  { icon: AlertTriangle, color: "text-amber-500", title: "Age Restrictions", body: "Some events may have age restrictions. Please verify event details before purchasing tickets." },
                  { icon: Info, color: "text-gray-400", title: "Event Changes", body: "The organizer reserves the right to make changes to the lineup or schedule. Ticket holders will be notified of any major changes." },
                  { icon: Info, color: "text-gray-400", title: "Liability", body: "LocalEvents acts as a platform connecting event-goers with organizers and is not liable for the conduct of events listed on this site." },
                ].map(({ icon: Icon, color, title, body }) => (
                  <div key={title} className="flex items-start gap-3">
                    <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${color}`} />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Similar events */}
            {similarEvents.length > 0 && (
              <section>
                <h2 className="text-base font-bold text-gray-900 mb-4" style={{ fontFamily: "'Sora', sans-serif" }}>
                  More events like this ✨
                </h2>
                <div
                  className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6"
                  style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
                >
                  {similarEvents.map((e) => (
                    <div key={e.id} className="shrink-0 w-52 sm:w-60">
                      <EventCard event={e} citySlug={citySlug} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ══ RIGHT COLUMN: sticky sidebar ══════════════════════════════ */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-6 space-y-2.5">

              {/* Price */}
              <div className="pb-4 border-b border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Tickets from</p>
                <p className={`text-3xl font-bold ${isFree ? "text-green-600" : "text-indigo-900"}`}>
                  {displayPrice}
                </p>
                {!isFree && <p className="text-xs text-gray-400 mt-0.5">Per person · No hidden fees</p>}
              </div>

              {/* Book Tickets lives here on desktop */}
              <Button onClick={handleGetTickets} className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-bold h-11">
                <Ticket className="w-4 h-4 mr-2" />Book Tickets
              </Button>

              <CalendarButton event={calendarEvent} />

              <Button
                onClick={() => setIsInterested((v) => !v)}
                variant="outline"
                className={`w-full h-10 font-semibold text-sm ${isInterested ? "bg-gray-50 border-gray-300 text-gray-800" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
              >
                <Users className="w-4 h-4 mr-2" />{isInterested ? "Interested ✓" : "I'm Interested"}
              </Button>

              <Button onClick={handleShare} variant="outline" className="w-full h-10 border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-sm">
                <Share2 className="w-4 h-4 mr-2" />Share Event
              </Button>

              <Button
                onClick={handleSaveEvent}
                variant="outline"
                className={`w-full h-10 font-semibold text-sm ${isSaved ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
              >
                <Bookmark className={`w-4 h-4 mr-2 ${isSaved ? "fill-indigo-600 text-indigo-600" : ""}`} />
                {isSaved ? "Saved" : "Save for later"}
              </Button>

              <p className="text-center text-xs text-gray-300 pt-1">Secure checkout · LocalEvents</p>
            </div>
          </div>

        </div>
      </div>

      <Footer />

      {/* Mobile sticky bottom bar — Book Tickets shown here (sidebar not visible on mobile) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 leading-none mb-0.5">Tickets from</p>
          <p className={`text-lg font-bold leading-tight ${isFree ? "text-green-600" : "text-indigo-900"}`}>{displayPrice}</p>
        </div>
        <Button
          onClick={handleSaveEvent}
          variant="outline"
          size="icon"
          className={`h-10 w-10 shrink-0 ${isSaved ? "border-indigo-200 bg-indigo-50" : "border-gray-200"}`}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? "fill-indigo-600 text-indigo-600" : "text-gray-400"}`} />
        </Button>
        <Button onClick={handleGetTickets} className="h-10 px-5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-sm shrink-0">
          Book Tickets
        </Button>
      </div>
    </div>
  );
}
