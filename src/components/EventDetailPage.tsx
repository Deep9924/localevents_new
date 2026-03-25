"use client";

import { useRouter } from "next/navigation";
import { Calendar, MapPin, Clock, Users, Share2, Heart, Ticket, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
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
    if (!user) { toast.error("Please sign in to save events"); return; }
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

  if (!city) {
    return (
      <div className="min-h-screen bg-[#FAFAF8]">
        <main className="max-w-4xl mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-indigo-900 mb-2">City not found</h1>
          <Button onClick={() => router.push("/")} className="bg-indigo-700 hover:bg-indigo-800">
            <ArrowLeft className="w-4 h-4 mr-2" />Back to Home
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#FAFAF8]">
        <main className="max-w-4xl mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-indigo-900 mb-2">Event not found</h1>
          <Button onClick={() => router.push(`/${citySlug}`)} className="bg-indigo-700 hover:bg-indigo-800">
            <ArrowLeft className="w-4 h-4 mr-2" />Back to {city.name}
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <main className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => router.push(`/${citySlug}`)}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />Back to {city.name}
        </button>

        {/* Hero image */}
        <div className="rounded-2xl overflow-hidden shadow-lg mb-8 bg-gray-100 h-96">
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: event details */}
          <div className="lg:col-span-2">
            <h1 className="text-4xl font-bold text-indigo-900 mb-4" style={{ fontFamily: "'Sora', sans-serif" }}>
              {event.title}
            </h1>

            <div className="flex flex-wrap gap-6 mb-8 pb-8 border-b border-gray-200">
              {[
                { icon: Calendar, label: "Date", value: event.date },
                { icon: Clock, label: "Time", value: event.time },
                { icon: MapPin, label: "Venue", value: event.venue },
                { icon: Users, label: "Category", value: event.category },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-2 text-gray-700">
                  <Icon className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="text-sm text-gray-500">{label}</p>
                    <p className="font-semibold capitalize">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-indigo-900 mb-4" style={{ fontFamily: "'Sora', sans-serif" }}>
                About this event
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Join us for an unforgettable experience at {event.title}! This is a premier event featuring
                world-class entertainment, amazing atmosphere, and an opportunity to connect with like-minded individuals.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Whether you're a seasoned attendee or a first-timer, this event promises to deliver memorable
                moments and exciting experiences. Come prepared for a fantastic time!
              </p>
            </div>

            <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100">
              <h3 className="text-lg font-bold text-indigo-900 mb-3" style={{ fontFamily: "'Sora', sans-serif" }}>
                Organized by
              </h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold">
                  LE
                </div>
                <div>
                  <p className="font-semibold text-indigo-900">LocalEvents Team</p>
                  <p className="text-sm text-gray-600">Verified organizer</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: ticket sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 border border-gray-100 sticky top-4 shadow-md">
              <div className="mb-6">
                <p className="text-sm text-gray-500 font-medium mb-1">Price</p>
                <p className={`text-3xl font-bold ${event.price === "Free" || event.price === null ? "text-green-600" : "text-indigo-900"}`}>
                  {event.price === null ? "Free" : event.price}
                </p>
                {event.price !== "Free" && event.price !== null && (
                  <p className="text-sm text-gray-400 mt-1">Per ticket</p>
                )}
              </div>

              <Button
                onClick={() => toast.info("Ticket booking system coming soon!")}
                className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-semibold mb-3 h-12"
              >
                <Ticket className="w-4 h-4 mr-2" />Get Tickets
              </Button>

              <Button
                onClick={() => toast.success("Event link copied to clipboard!")}
                variant="outline"
                className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold mb-3 h-10"
              >
                <Share2 className="w-4 h-4 mr-2" />Share Event
              </Button>

              <Button
                onClick={handleSaveEvent}
                variant={isSaved ? "default" : "outline"}
                className={`w-full font-semibold mb-4 h-10 ${
                  isSaved
                    ? "bg-amber-500 hover:bg-amber-600 text-white"
                    : "border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                }`}
              >
                <Heart className={`w-4 h-4 mr-2 ${isSaved ? "fill-current" : ""}`} />
                {isSaved ? "Saved" : "Save Event"}
              </Button>

              <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                <p className="text-xs text-amber-800 font-medium mb-2">Pro tip</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Early bird tickets often sell out. Secure your spot now!
                </p>
              </div>
            </div>
          </div>
        </div>

        {event && (
          <SimilarEvents eventId={event.id} category={event.category} citySlug={event.citySlug} />
        )}
        {event && event.organizerId && (
          <OrganizerProfile organizerId={event.organizerId} />
        )}
      </main>
      <Footer />
    </div>
  );
}