"use client";

import { useRouter } from "next/navigation";
import {
  Calendar, MapPin, Clock, Users, Share2, Heart,
  Ticket, ArrowLeft, AlertCircle, Loader2, Tag,
  ExternalLink, Star,
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

// ── Error state ──────────────────────────────────────────────────────────────

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

// ── Highlight row item ───────────────────────────────────────────────────────

function HighlightChip({
  icon: Icon,
  label,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3.5">
      <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-indigo-600" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900 leading-tight">{label}</p>
        {sub && <p className="text-xs text-gray-500 truncate">{sub}</p>}
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

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: event, isLoading: eventLoading } = trpc.events.getBySlug.useQuery(
    { citySlug: citySlug ?? "", eventSlug: eventSlug ?? "" },
    { enabled: !!citySlug && !!eventSlug }
  );

  const { data: savedStatus } = trpc.savedEvents.isSaved.useQuery(
    { eventId: event?.id ?? "" },
    { enabled: !!user && !!event?.id }
  );

  const { data: similarEvents = [] } = trpc.events.getSimilar.useQuery(
    {
      eventId: event?.id ?? "",
      category: event?.category ?? "",
      citySlug: citySlug ?? "",
      limit: 8,
    },
    { enabled: !!event?.id }
  );

  useEffect(() => {
    if (savedStatus !== undefined) setIsSaved(savedStatus);
  }, [savedStatus]);

  // ── Mutations ──────────────────────────────────────────────────────────────
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

  // ── Guards ─────────────────────────────────────────────────────────────────
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
  const tags: string[] = (event as any).tags ?? [event.category];

  const calendarEvent = {
    title: event.title,
    description: event.description ?? null,
    date:
      typeof event.date === "string"
        ? event.date
        : (event.date as Date).toLocaleDateString("en-CA"),
    time: event.time,
    venue: event.venue,
  };

  return (
    // Extra bottom padding on mobile so content clears the sticky bar
    <div className="min-h-screen bg-[#FAFAF8] pb-24 lg:pb-0">

      {/* ── Hero image ─────────────────────────────────────────────────────── */}
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

        {/* Back pill over image */}
        <button
          onClick={() => router.push(`/${citySlug}`)}
          className="absolute top-4 left-4 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-indigo-700 hover:bg-white text-sm font-semibold px-3 py-2 rounded-full shadow transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {city.name}
        </button>

        {event.isFeatured && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-amber-500 text-white border-0 shadow text-xs px-2.5 py-1">
              <Star className="w-3 h-3 mr-1 fill-current inline" />Featured
            </Badge>
          </div>
        )}
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8 lg:items-start">

          {/* ══ LEFT COLUMN ═══════════════════════════════════════════════════ */}
          <div className="lg:col-span-2 space-y-5">

            {/* Title + organizer */}
            <div>
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

            {/* Highlights card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100 px-5">
              <HighlightChip
                icon={Calendar}
                label={`${event.date} · ${event.time}`}
                sub="Date & Time"
              />
              <HighlightChip icon={Clock} label="~2 hours" sub="Estimated duration" />
              <HighlightChip
                icon={MapPin}
                label={event.venue}
                sub={`${city.name}, ${city.province}`}
              />
              <HighlightChip
                icon={Tag}
                label={isFree ? "Free entry" : `Starting at ${displayPrice}`}
                sub="Price"
              />
              {(event.interested ?? 0) > 0 && (
                <HighlightChip
                  icon={Users}
                  label={`${event.interested}+ Interested`}
                  sub="People going"
                />
              )}
            </div>

            {/* Quick actions row */}
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
                <Heart className={`w-4 h-4 mr-1.5 ${isInterested ? "fill-current" : ""}`} />
                {isInterested ? "Interested" : "I'm Interested"}
              </Button>
              <Button
                onClick={handleShare}
                variant="outline"
                className="flex-1 h-11 border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-sm"
              >
                <Share2 className="w-4 h-4 mr-1.5" />Share
              </Button>
              {/* Book Tickets visible on sm+; hidden on mobile (shown in sticky bar) */}
              <Button
                onClick={handleGetTickets}
                className="hidden sm:flex flex-1 h-11 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold text-sm"
              >
                <Ticket className="w-4 h-4 mr-1.5" />Book Tickets
              </Button>
            </div>

            {/* Date & Location card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
              <h2 className="font-bold text-gray-900">Date &amp; Location</h2>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{event.date} · {event.time}</p>
                  <div className="mt-2 max-w-xs">
                    <CalendarButton event={calendarEvent} />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{event.venue}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{city.name}, {city.province}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${event.venue} ${city.name}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 font-medium mt-1.5"
                  >
                    View on map <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-3">About the event</h2>
              {event.description ? (
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>
              ) : (
                <p className="text-gray-400 text-sm italic">No description available.</p>
              )}
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1 capitalize"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Host */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-4">Host Details</h2>
              {event.organizerId ? (
                <OrganizerProfile organizerId={event.organizerId} />
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                    LE
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">LocalEvents Team</p>
                    <p className="text-xs text-gray-500 mt-0.5">Verified organizer</p>
                  </div>
                </div>
              )}
            </div>

            {/* ── Similar events — horizontal scroll ───────────────────────── */}
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
                  style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
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

          {/* ══ RIGHT COLUMN: sticky sidebar (desktop only) ═══════════════════ */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-5 sticky top-6 space-y-3">
              <div className="pb-4 border-b border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">
                  Tickets from
                </p>
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
                <Heart
                  className={`w-4 h-4 mr-2 ${isInterested ? "fill-amber-500 text-amber-500" : ""}`}
                />
                {isInterested ? "Interested" : "I'm Interested"}
              </Button>

              <Button
                onClick={handleShare}
                variant="outline"
                className="w-full h-10 border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-sm"
              >
                <Share2 className="w-4 h-4 mr-2" />Share Event
              </Button>

              <Button
                onClick={handleSaveEvent}
                variant="outline"
                className={`w-full h-10 font-semibold text-sm ${
                  isSaved
                    ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Heart
                  className={`w-4 h-4 mr-2 ${isSaved ? "fill-amber-500 text-amber-500" : ""}`}
                />
                {isSaved ? "Saved" : "Save for later"}
              </Button>

              <p className="text-center text-xs text-gray-400 pt-1">
                Secure checkout · No hidden fees
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* ── Sticky mobile bottom bar ────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 leading-none mb-0.5">Tickets from</p>
          <p className={`text-lg font-bold leading-tight ${isFree ? "text-green-600" : "text-indigo-900"}`}>
            {displayPrice}
          </p>
        </div>
        <Button
          onClick={handleSaveEvent}
          variant="outline"
          size="icon"
          className={`h-11 w-11 shrink-0 ${
            isSaved ? "border-amber-300 bg-amber-50" : "border-gray-200"
          }`}
        >
          <Heart className={`w-5 h-5 ${isSaved ? "fill-amber-500 text-amber-500" : "text-gray-400"}`} />
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
