"use client";

import { useRouter } from "next/navigation";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Share2,
  Heart,
  Ticket,
  ArrowLeft,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Footer from "@/components/Footer";
import { CITIES } from "@/lib/events-data";
import SimilarEvents from "@/components/SimilarEvents";
import OrganizerProfile from "@/components/OrganizerProfile";

interface EventDetailPageProps {
  citySlug?: string;
  eventSlug?: string;
}

export default function EventDetailPage({ citySlug, eventSlug }: EventDetailPageProps) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(false);
  const [imgError, setImgError] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [citySlug, eventSlug]);

  const { data: event, isLoading: eventLoading } = trpc.events.getBySlug.useQuery(
    { citySlug: citySlug || "", eventSlug: eventSlug || "" },
    { enabled: !!citySlug && !!eventSlug }
  );

  const { data: savedStatus } = trpc.savedEvents.isSaved.useQuery(
    { eventId: event?.id || "" },
    { enabled: !!user && !!event?.id }
  );

  useEffect(() => {
    if (savedStatus !== undefined) setIsSaved(savedStatus);
  }, [savedStatus]);

  const saveEventMutation = trpc.savedEvents.save.useMutation();
  const unsaveEventMutation = trpc.savedEvents.unsave.useMutation();

  const handleSaveEvent = async () => {
    if (!user) {
      toast.error("Please sign in to save events");
      return;
    }
    if (!event) return;
    try {
      if (isSaved) {
        await unsaveEventMutation.mutateAsync({ eventId: event.id });
        setIsSaved(false);
        toast.success("Event removed from saved");
      } else {
        await saveEventMutation.mutateAsync({
          eventId: event.id,
          eventTitle: event.title,
          eventDate: event.date,
          eventCity: event.city,
        });
        setIsSaved(true);
        toast.success("Event saved!");
      }
    } catch {
      toast.error("Failed to save event");
    }
  };

  const city = CITIES.find((c) => c.slug === citySlug);

  if (eventLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-500">
        <AlertCircle className="w-12 h-12" />
        <p className="text-lg font-medium">Event not found</p>
        <Button variant="outline" onClick={() => router.push(`/${citySlug}`)}>
          Back to {city?.name ?? "City"}
        </Button>
      </div>
    );
  }

  const DetailItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-indigo-500 shrink-0">{icon}</div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{label}</p>
        <p className="text-sm text-gray-800 font-medium mt-0.5">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Back button */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-2">
        <button
          onClick={() => router.push(`/${citySlug}`)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {city?.name ?? "Events"}
        </button>
      </div>

      {/* Hero image */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-6">
        <div className="w-full h-64 sm:h-96 rounded-2xl overflow-hidden bg-gray-200 relative">
          {!imgError && event.image ? (
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-amber-100">
              <Ticket className="w-16 h-16 text-indigo-300" />
            </div>
          )}
          {event.category && (
            <span className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur-sm text-indigo-700 text-xs font-semibold rounded-full shadow-sm capitalize">
              {event.category}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left — main content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Title + actions */}
            <div className="flex items-start justify-between gap-4">
              <h1
                className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                {event.title}
              </h1>
              <div className="flex items-center gap-2 shrink-0 mt-1">
                <button
                  onClick={handleSaveEvent}
                  className={`p-2 rounded-full border transition-colors ${
                    isSaved
                      ? "bg-red-50 border-red-200 text-red-500"
                      : "border-gray-200 text-gray-400 hover:text-red-400 hover:border-red-200"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Link copied!");
                  }}
                  className="p-2 rounded-full border border-gray-200 text-gray-400 hover:text-indigo-500 hover:border-indigo-200 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Event details grid */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <DetailItem
                icon={<Calendar className="w-4 h-4" />}
                label="Date"
                value={event.date}
              />
              <DetailItem
                icon={<Clock className="w-4 h-4" />}
                label="Time"
                value={event.time ?? "TBA"}
              />
              <DetailItem
                icon={<MapPin className="w-4 h-4" />}
                label="Location"
                value={event.venue ?? "TBA"}
              />
              <DetailItem
                icon={<Users className="w-4 h-4" />}
                label="Interested"
                value={(event.interested ?? 0) > 0 ? `${event.interested} interested` : "Open attendance"}
              />
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h2 className="text-base font-semibold text-gray-800 mb-3" style={{ fontFamily: "'Sora', sans-serif" }}>
                About this event
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                {event.description ?? `Join us for an unforgettable experience at ${event.title}! This is a premier event featuring world-class entertainment, amazing atmosphere, and an opportunity to connect with like-minded individuals.`}
              </p>
              {!event.description && (
                <p className="text-sm text-gray-600 leading-relaxed mt-3">
                  Whether you're a seasoned attendee or a first-timer, this event promises to deliver memorable moments and exciting experiences. Come prepared for a fantastic time!
                </p>
              )}
            </div>

            {/* Organizer */}
            <OrganizerProfile citySlug={citySlug ?? ""} />

            {/* Similar events */}
            <SimilarEvents
              citySlug={citySlug ?? ""}
              category={event.category ?? ""}
              currentEventId={event.id}
            />
          </div>

          {/* Right — ticket sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">

              {/* Price */}
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Price</p>
                <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Sora', sans-serif" }}>
                  {event.price === null ? "Free" : event.price}
                </p>
                {event.price !== "Free" && event.price !== null && (
                  <p className="text-xs text-gray-400">Per ticket</p>
                )}
              </div>

              <div className="border-t border-gray-100" />

              {/* CTA */}
              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-full py-5 font-semibold text-sm"
                onClick={() => toast.info("Ticketing coming soon!")}
              >
                <Ticket className="w-4 h-4 mr-2" />
                Get Tickets
              </Button>

              {/* Pro tip */}
              <div className="bg-amber-50 rounded-xl p-3 flex gap-2">
                <span className="text-amber-500 text-sm">💡</span>
                <p className="text-xs text-amber-700">
                  <span className="font-semibold">Pro tip</span> — Early bird tickets often sell out. Secure your spot now!
                </p>
              </div>

              {/* LocalEvents badge */}
              <div className="flex items-center gap-2 pt-1">
                <div className="w-5 h-5 rounded bg-indigo-700 flex items-center justify-center">
                  <span className="text-white text-[9px] font-bold">LE</span>
                </div>
                <p className="text-xs text-gray-400">LocalEvents Team</p>
                <span className="ml-auto text-xs text-green-600 font-medium">✓ Verified organizer</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
