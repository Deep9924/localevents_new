"use client";

import { useRouter } from "next/navigation";
import {
  Calendar, MapPin, Clock, Users, Share2, Heart,
  Ticket, ArrowLeft, AlertCircle, Loader2, Tag,
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

// ── Small helpers ────────────────────────────────────────────────────────────

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

// ── Main component ───────────────────────────────────────────────────────────

export default function EventDetailPage({ citySlug, eventSlug }: EventDetailPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Scroll to top on navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [citySlug, eventSlug]);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: event, isLoading: eventLoading } = trpc.events.getBySlug.useQuery(
    { citySlug: citySlug ?? "", eventSlug: eventSlug ?? "" },
    { enabled: !!citySlug && !!eventSlug }
  );

  const { data: savedStatus } = trpc.savedEvents.isSaved.useQuery(
    { eventId: event?.id ?? "" },
    { enabled: !!user && !!event?.id }
  );

  const { data: similarEvents = [] } = trpc.events.getSimilar.useQuery(
    { eventId: event?.id ?? "", category: event?.category ?? "", citySlug: citySlug ?? "", limit: 4 },
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
          eventCity: event.citySlug,   // use citySlug, not display name
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
        toast.success("Link copied to clipboard!");
      }
    } catch {
      toast.error("Could not share event");
    }
  };

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

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <main className="max-w-4xl mx-auto px-4 py-8">

        {/* Back button */}
        <button
          onClick={() => router.push(`/${citySlug}`)}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />Back to {city.name}
        </button>

        {/* Hero image */}
        <div className="rounded-2xl overflow-hidden shadow-lg mb-8 bg-gray-100 h-96 relative">
          {!imgError && event.image ? (
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-amber-50 flex items-center justify-center">
              <Calendar className="w-16 h-16 text-indigo-300" />
            </div>
          )}

          {/* Overlay badges */}
          <div className="absolute top-4 left-4 flex gap-2">
            {event.isFeatured && (
              <Badge className="bg-amber-500 text-white border-0 shadow">★ Featured</Badge>
            )}
            <Badge className="bg-white/90 text-indigo-800 border-0 shadow capitalize">
              {event.category}
            </Badge>
          </div>

          {isFree && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-green-500 text-white border-0 shadow text-sm px-3 py-1">
                Free
              </Badge>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left: event details ─────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Title */}
            <div>
              <h1
                className="text-4xl font-bold text-indigo-900 mb-3 leading-tight"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                {event.title}
              </h1>
              {(event.interested ?? 0) > 0 && (
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span className="font-semibold text-indigo-600">{event.interested}</span> people interested
                </p>
              )}
            </div>

            {/* Meta chips */}
            <div className="grid grid-cols-2 gap-4 pb-8 border-b border-gray-200">
              {[
                { icon: Calendar, label: "Date", value: event.date },
                { icon: Clock, label: "Time", value: event.time },
                { icon: MapPin, label: "Venue", value: event.venue },
                { icon: Tag, label: "Category", value: event.category },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3 bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{label}</p>
                    <p className="font-semibold text-gray-800 text-sm capitalize truncate">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Description — use real description if available, fallback otherwise */}
            <div>
              <h2
                className="text-2xl font-bold text-indigo-900 mb-4"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                About this event
              </h2>
              {event.description ? (
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>
              ) : (
                <p className="text-gray-500 italic text-sm">
                  No description available for this event.
                </p>
              )}
            </div>

            {/* Organizer */}
            {event.organizerId ? (
              <OrganizerProfile organizerId={event.organizerId} />
            ) : (
              <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-100 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold shrink-0">
                  LE
                </div>
                <div>
                  <p className="font-semibold text-indigo-900">LocalEvents Team</p>
                  <p className="text-sm text-gray-500">Verified organizer</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: sticky sidebar ───────────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 sticky top-4 shadow-md space-y-3">

              {/* Price */}
              <div className="pb-4 border-b border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Price</p>
                <p className={`text-3xl font-bold ${isFree ? "text-green-600" : "text-indigo-900"}`}>
                  {isFree ? "Free" : event.price}
                </p>
                {!isFree && <p className="text-xs text-gray-400 mt-0.5">Per ticket</p>}
              </div>

              {/* Actions */}
              <Button
                onClick={() => toast.info("Ticket booking coming soon!")}
                className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-semibold h-12"
              >
                <Ticket className="w-4 h-4 mr-2" />Get Tickets
              </Button>

              <CalendarButton event={event} />

              <Button
                onClick={handleShare}
                variant="outline"
                className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold h-10"
              >
                <Share2 className="w-4 h-4 mr-2" />Share Event
              </Button>

              <Button
                onClick={handleSaveEvent}
                variant={isSaved ? "default" : "outline"}
                className={`w-full font-semibold h-10 ${
                  isSaved
                    ? "bg-amber-500 hover:bg-amber-600 text-white"
                    : "border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                }`}
              >
                <Heart className={`w-4 h-4 mr-2 ${isSaved ? "fill-current" : ""}`} />
                {isSaved ? "Saved" : "Save Event"}
              </Button>

              {/* Tip */}
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-100 mt-1">
                <p className="text-xs font-semibold text-amber-800 mb-1">Pro tip</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Early bird tickets often sell out. Secure your spot now!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Similar events ─────────────────────────────────────────────────── */}
        {similarEvents.length > 0 && (
          <section className="mt-16">
            <h2
              className="text-2xl font-bold text-indigo-900 mb-6"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              Similar Events in {city.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarEvents.map((e) => (
                <EventCard key={e.id} event={e} citySlug={citySlug} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
