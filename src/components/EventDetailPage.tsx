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
import { toast } from "sonner";
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

function ErrorState({
  icon,
  title,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  action: React.ReactNode;
}) {
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

// ── Breadcrumb ───────────────────────────────────────────────────────────────
function Breadcrumb({
  citySlug,
  cityName,
  eventTitle,
}: {
  citySlug: string;
  cityName: string;
  eventTitle: string;
}) {
  const router = useRouter();
  return (
    <nav className="flex items-center gap-1.5 text-xs text-gray-400 flex-wrap">
      <button
        onClick={() => router.push("/")}
        className="flex items-center gap-1 hover:text-indigo-600 transition-colors font-medium"
      >
        <Home className="w-3 h-3" />
        Home
      </button>
      <ChevronRight className="w-3 h-3 shrink-0" />
      <button
        onClick={() => router.push(`/${citySlug}`)}
        className="hover:text-indigo-600 transition-colors font-medium capitalize"
      >
        {cityName}
      </button>
      <ChevronRight className="w-3 h-3 shrink-0" />
      <span className="text-gray-500 font-medium truncate max-w-[180px] sm:max-w-xs">
        {eventTitle}
      </span>
    </nav>
  );
}

// ── Highlight row ────────────────────────────────────────────────────────────
function HighlightRow({
  icon: Icon,
  label,
  sub,
  color = "indigo",
}: {
  icon: React.ElementType;
  label: string;
  sub?: string;
  color?: "indigo" | "amber" | "green" | "rose";
}) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600",
    amber: "bg-amber-50 text-amber-600",
    green: "bg-green-50 text-green-600",
    rose: "bg-rose-50 text-rose-500",
  };
  return (
    <div className="flex items-center gap-4 py-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
        <Icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900 leading-tight">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
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
    if (!user) { toast.error("Please sign in to save events"); return; }
    if (!event) return;
    try {
      if (isSaved) {
        await unsaveEventMutation.mutateAsync({ eventId: event.id });
        setIsSaved(false);
        toast.success("Removed from saved events");
      } else {
        await saveEventMutation.mutateAsync({
          eventId: event.id,
          eventTitle: event.title,
          eventDate: event.date,
          eventCity: event.citySlug,
        });
        setIsSaved(true);
        toast.success("Event saved!");
      }
    } catch {
      toast.error("Failed to save event");
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: event?.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied!");
      }
    } catch {
      toast.error("Could not share event");
    }
  };

  const handleGetTickets = () => toast.info("Ticket booking coming soon!");

  const city = CITIES.find((c) => c.slug === citySlug);

  if (eventLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!city) {
    return (
      <ErrorState
        icon={<AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />}
        title="City not found"
        action={
          <Button onClick={() => router.push("/")} className="bg-indigo-700 hover:bg-indigo-800">
            <ArrowLeft className="w-4 h-4 mr-2" />Back to Home
          </Button>
        }
      />
    );
  }

  if (!event) {
    return (
      <ErrorState
        icon={<AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />}
        title="Event not found"
        action={
          <Button onClick={() => router.push(`/${citySlug}`)} className="bg-indigo-700 hover:bg-indigo-800">
            <ArrowLeft className="w-4 h-4 mr-2" />Back to {city.name}
          </Button>
        }
      />
    );
  }

  const isFree = event.price === "Free" || event.price === null;
  const displayPrice = isFree ? "Free" : event.price;

  const tags: string[] = (() => {
    const raw = event.tags;
    if (!raw) return [event.category];
    if (Array.isArray(raw)) return raw;
    return String(raw).split(",").map((t) => t.trim()).filter(Boolean);
  })();

  const calendarEvent = {
    title: event.title,
    description: event.description ?? null,
    date: typeof event.date === "string"
      ? event.date
      : (event.date as Date).toLocaleDateString("en-CA"),
    time: event.time,
    venue: event.venue,
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-24 lg:pb-0">

      {/* ── Breadcrumb ────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-3">
        <Breadcrumb
          citySlug={citySlug!}
          cityName={city.name}
          eventTitle={event.title}
        />
      </div>

      {/* ── Hero image (clean — no badge clutter) ─────────────────────────── */}
      <div className="relative w-full bg-gray-100 overflow-hidden" style={{ maxHeight: 480 }}>
        {!imgError && event.image ? (
          <img
            src={event.image}
            alt={event.title}
            className="w-full object-cover"
            style={{ maxHeight: 480, minHeight: 240, width: "100%" }}
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="w-full bg-gradient-to-br from-indigo-100 via-amber-50 to-indigo-50 flex items-center justify-center"
            style={{ height: 360 }}
          >
            <Calendar className="w-20 h-20 text-indigo-200" />
          </div>
        )}
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8 lg:items-start">

          {/* ══ LEFT COLUMN ════════════════════════════════════════════════ */}
          <div className="lg:col-span-2 space-y-5">

            {/* Title row + Featured badge here (clean, below image) */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-semibold capitalize">
                  {event.category}
                </Badge>
                {event.isFeatured && (
                  <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
                    <Star className="w-3 h-3 mr-1 fill-amber-500 text-amber-500 inline" />
                    Featured
                  </Badge>
                )}
                {isFree && (
                  <Badge className="bg-green-50 text-green-700 border border-green-200 text-xs font-semibold">
                    Free Entry
                  </Badge>
                )}
              </div>

              <h1
                className="text-2xl sm:text-3xl lg:text-4xl font-bold text-indigo-900 leading-tight mb-2"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                {event.title}
              </h1>

              <div className="flex items-center gap-2 text-sm">
                <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {((event as any).organizerName ?? "L")[0].toUpperCase()}
                </div>
                <span className="font-medium text-gray-700">
                  {(event as any).organizerName ?? "LocalEvents Team"}
                </span>
                <span className="text-gray-300">·</span>
                <span className="text-xs font-medium text-indigo-500">Verified</span>
              </div>
            </div>

            {/* ── Highlights card (improved) ─────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 divide-y divide-gray-100">
              <HighlightRow
                icon={Calendar}
                label={`${event.date}`}
                sub={`Doors open at ${event.time}`}
                color="indigo"
              />
              <HighlightRow
                icon={Clock}
                label={event.time}
                sub="Start time · approx. 2 hrs"
                color="indigo"
              />
              <HighlightRow
                icon={MapPin}
                label={event.venue}
                sub={`${city.name}, ${city.province}`}
                color="amber"
              />
              <HighlightRow
                icon={Tag}
                label={isFree ? "Free Entry" : `${displayPrice} per person`}
                sub={isFree ? "No tickets required" : "Secure checkout · No hidden fees"}
                color={isFree ? "green" : "indigo"}
              />
              {(event.interested ?? 0) > 0 && (
                <HighlightRow
                  icon={Users}
                  label={`${event.interested}+ people interested`}
                  sub="Join the crowd"
                  color="indigo"
                />
              )}
            </div>

            {/* Quick actions */}
            <div className="flex gap-2.5">
              <Button
                onClick={() => {
                  setIsInterested((v) => !v);
                  toast.success(isInterested ? "Removed interest" : "Marked as interested!");
                }}
                variant={isInterested ? "default" : "outline"}
                className={`flex-1 h-11 font-semibold text-sm ${
                  isInterested
                    ? "bg-indigo-700 hover:bg-indigo-800 text-white"
                    : "border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                }`}
              >
                <Users className={`w-4 h-4 mr-1.5`} />
                {isInterested ? "Interested" : "I'm Interested"}
              </Button>
              <Button
                onClick={handleShare}
                variant="outline"
                className="flex-1 h-11 border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-sm"
              >
                <Share2 className="w-4 h-4 mr-1.5" />Share
              </Button>
              <Button
                onClick={handleGetTickets}
                className="hidden sm:flex flex-1 h-11 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold text-sm"
              >
                <Ticket className="w-4 h-4 mr-1.5" />Book Tickets
              </Button>
            </div>

            {/* ── Date & Location (improved) ─────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 pt-5 pb-3 border-b border-gray-100">
                <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Date &amp; Location</h2>
              </div>

              {/* Date row */}
              <div className="px-5 py-4 flex items-start gap-4 border-b border-gray-100">
                {/* Calendar icon block */}
                <div className="w-12 h-12 rounded-xl bg-indigo-600 flex flex-col items-center justify-center shrink-0 text-white">
                  <span className="text-[10px] font-bold uppercase leading-none opacity-80">
                    {event.date?.split(" ")[2] ?? ""}
                  </span>
                  <span className="text-lg font-bold leading-none">
                    {event.date?.split(" ")[1] ?? ""}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{event.date}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Starts at {event.time} · Approx. 2 hours</p>
                  <div className="mt-3">
                    <CalendarButton event={calendarEvent} />
                  </div>
                </div>
              </div>

              {/* Location row */}
              <div className="px-5 py-4 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{event.venue}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{city.name}, {city.province}, {city.country}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue} ${city.name}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 font-semibold mt-2 bg-indigo-50 px-2.5 py-1 rounded-full transition-colors"
                  >
                    <MapPin className="w-3 h-3" />
                    View on Google Maps
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-3">About the event</h2>
              {event.description ? (
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{event.description}</p>
              ) : (
                <p className="text-gray-400 text-sm italic">No description available.</p>
              )}
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1 capitalize"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* ── Terms & Conditions (replaces Host Details) ──────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 pt-5 pb-3 border-b border-gray-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Terms &amp; Conditions</h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Ticket Policy</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      All ticket sales are final. No refunds or exchanges unless the event is cancelled or rescheduled by the organizer.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Entry Requirements</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      Valid ID may be required for entry. Tickets must be presented digitally or printed at the door.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Age Restrictions</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      Some events may have age restrictions. Please verify event details before purchasing tickets.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Event Changes</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      The organizer reserves the right to make changes to the event lineup or schedule. Ticket holders will be notified of any major changes.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Liability</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      LocalEvents acts as a platform connecting event-goers with organizers and is not liable for the conduct of events listed on this site.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Similar events */}
            {similarEvents.length > 0 && (
              <section>
                <h2
                  className="text-lg font-bold text-indigo-900 mb-4"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
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

          {/* ══ RIGHT COLUMN: sticky sidebar (desktop only) ════════════════ */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-5 sticky top-6 space-y-3">
              <div className="pb-4 border-b border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Tickets from</p>
                <p className={`text-3xl font-bold ${isFree ? "text-green-600" : "text-indigo-900"}`}>
                  {displayPrice}
                </p>
                {!isFree && <p className="text-xs text-gray-400 mt-0.5">Per person</p>}
              </div>

              <Button
                onClick={handleGetTickets}
                className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-bold h-12 text-base"
              >
                <Ticket className="w-4 h-4 mr-2" />Book Tickets
              </Button>

              <Button
                onClick={() => {
                  setIsInterested((v) => !v);
                  toast.success(isInterested ? "Removed interest" : "Marked as interested!");
                }}
                variant="outline"
                className={`w-full h-10 font-semibold text-sm ${
                  isInterested
                    ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Users className="w-4 h-4 mr-2" />
                {isInterested ? "Interested ✓" : "I'm Interested"}
              </Button>

              <Button
                onClick={handleShare}
                variant="outline"
                className="w-full h-10 border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-sm"
              >
                <Share2 className="w-4 h-4 mr-2" />Share Event
              </Button>

              {/* ✅ Bookmark icon for Save */}
              <Button
                onClick={handleSaveEvent}
                variant="outline"
                className={`w-full h-10 font-semibold text-sm ${
                  isSaved
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Bookmark className={`w-4 h-4 mr-2 ${isSaved ? "fill-indigo-600 text-indigo-600" : ""}`} />
                {isSaved ? "Saved" : "Save for later"}
              </Button>

              <p className="text-center text-xs text-gray-400 pt-1">Secure checkout · No hidden fees</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* ── Mobile sticky bottom bar ──────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 leading-none mb-0.5">Tickets from</p>
          <p className={`text-lg font-bold leading-tight ${isFree ? "text-green-600" : "text-indigo-900"}`}>
            {displayPrice}
          </p>
        </div>
        {/* ✅ Bookmark icon */}
        <Button
          onClick={handleSaveEvent}
          variant="outline"
          size="icon"
          className={`h-11 w-11 shrink-0 ${isSaved ? "border-indigo-300 bg-indigo-50" : "border-gray-200"}`}
        >
          <Bookmark className={`w-5 h-5 ${isSaved ? "fill-indigo-600 text-indigo-600" : "text-gray-400"}`} />
        </Button>
        <Button
          onClick={handleGetTickets}
          className="h-11 px-6 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-sm shrink-0"
        >
          Book Tickets
        </Button>
      </div>
    </div>
  );
    }
