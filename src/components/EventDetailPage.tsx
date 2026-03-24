"use client";

import { useRouter } from "next/navigation";
import { 
  Calendar, MapPin, Clock, Users, Share2, Heart, 
  Ticket, ArrowLeft, AlertCircle, Loader2, 
  Facebook, Twitter, Mail, ExternalLink, Info,
  Navigation
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import Footer from "@/components/Footer";
import SimilarEvents from "@/components/SimilarEvents";
import OrganizerProfile from "@/components/OrganizerProfile";
import CalendarButton from "@/components/CalendarButton";
import { MapView } from "@/components/Map";

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

  const { data: cities = [], isLoading: citiesLoading } = trpc.events.getCities.useQuery();
  const city = useMemo(() => cities.find((c) => c.slug === citySlug), [cities, citySlug]);

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

  const handleShare = (platform: 'twitter' | 'facebook' | 'email') => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = `Check out ${event?.title} on LocalEvents!`;
    const shares = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      email: `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`
    };
    window.open(shares[platform], '_blank');
  };

  if (eventLoading || citiesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-gray-500 font-medium">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#FAFAF8]">
        <main className="max-w-4xl mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-indigo-900 mb-2">Event not found</h1>
          <Button onClick={() => router.push("/")} className="bg-indigo-700 hover:bg-indigo-800">
            <ArrowLeft className="w-4 h-4 mr-2" />Back to Home
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Breadcrumb */}
      <nav className="bg-slate-50 border-b border-slate-100 py-3">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-2 text-xs font-medium text-slate-500">
          <button onClick={() => router.push("/")} className="hover:text-indigo-600 transition-colors">Home</button>
          <span>/</span>
          <button onClick={() => router.push(`/${citySlug}`)} className="hover:text-indigo-600 transition-colors">{city?.name ?? citySlug}</button>
          <span>/</span>
          <span className="text-slate-900 truncate max-w-[200px]">{event.title}</span>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Main Content (Left) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Hero Image */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-slate-100 aspect-video lg:aspect-[21/9]">
              {!imgError && event.image ? (
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-amber-50 flex items-center justify-center">
                  <Calendar className="w-20 h-20 text-indigo-200" />
                </div>
              )}
              {event.isFeatured && (
                <div className="absolute top-4 left-4 bg-amber-400 text-amber-950 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                  <span className="text-amber-100">★</span> FEATURED EVENT
                </div>
              )}
            </div>

            {/* Event Header */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-600 font-bold text-sm tracking-wider uppercase font-sora">
                <Calendar className="w-4 h-4" />
                <span>{event.date} • {event.time}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight font-sora">
                {event.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-slate-600">
                <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full text-sm">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">{event.venue}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full text-sm">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="font-medium capitalize">{event.category}</span>
                </div>
                {event.interested && event.interested > 0 && (
                  <div className="flex items-center gap-1.5 text-indigo-600 text-sm font-semibold">
                    <Heart className="w-4 h-4 fill-indigo-600" />
                    <span>{event.interested} people interested</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description Section */}
            <div className="prose prose-slate max-w-none">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-4 font-sora">
                <Info className="w-6 h-6 text-indigo-500" />
                About this event
              </h2>
              <div className="text-slate-700 leading-relaxed text-lg space-y-4">
                {event.description ? (
                  <p className="whitespace-pre-wrap">{event.description}</p>
                ) : (
                  <>
                    <p>
                      Join us for an unforgettable experience at <strong>{event.title}</strong>! This is a premier event in {city?.name ?? citySlug} featuring
                      world-class entertainment and an amazing atmosphere.
                    </p>
                    <p>
                      Whether you're a local or just visiting, this {event.category} event promises to deliver memorable
                      moments and exciting experiences. Don't miss out on this opportunity to connect with the community at {event.venue}.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Map Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 font-sora">
                <Navigation className="w-6 h-6 text-indigo-500" />
                Location
              </h2>
              <div className="rounded-2xl overflow-hidden border border-slate-200 h-64 relative group shadow-sm">
                <MapView
                  initialCenter={{ lat: city?.lat ?? 43.6532, lng: city?.lng ?? -79.3832 }}
                  initialZoom={14}
                  className="w-full h-full"
                />
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-slate-100 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{event.venue}</p>
                    <p className="text-xs text-slate-500 truncate">{city?.name ?? citySlug}, {city?.province}</p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue}, ${city?.name ?? citySlug}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Organizer Section */}
            {event.organizerId ? (
              <OrganizerProfile organizerId={event.organizerId} />
            ) : (
              <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-indigo-200">
                  LE
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="text-xl font-bold text-slate-900 font-sora">LocalEvents Team</h3>
                  <p className="text-slate-500">Verified community organizer</p>
                  <p className="text-sm text-slate-600 max-w-md">We curate the best local events to help you discover what's happening in your neighborhood.</p>
                </div>
                <Button variant="outline" className="border-slate-200 hover:bg-white">Follow</Button>
              </div>
            )}
          </div>

          {/* Sidebar (Right) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl shadow-slate-200/50 sticky top-8 space-y-6">
              
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Price</p>
                <div className="flex items-baseline gap-1">
                  <span className={`text-4xl font-black ${event.price === "Free" || event.price === null ? "text-emerald-600" : "text-slate-900"}`}>
                    {event.price === null ? "Free" : event.price}
                  </span>
                  {event.price !== "Free" && event.price !== null && (
                    <span className="text-slate-400 font-medium">/ person</span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => toast.info("Ticket booking system coming soon!")}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-14 rounded-2xl text-lg shadow-lg shadow-indigo-200 transition-all active:scale-95"
                >
                  <Ticket className="w-5 h-5 mr-2" />Get Tickets
                </Button>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleSaveEvent}
                    variant={isSaved ? "default" : "outline"}
                    className={`h-12 rounded-xl font-bold transition-all ${
                      isSaved
                        ? "bg-rose-500 hover:bg-rose-600 text-white border-rose-500"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${isSaved ? "fill-current" : ""}`} />
                    {isSaved ? "Saved" : "Save"}
                  </Button>
                  <CalendarButton event={event} />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 space-y-4">
                <p className="text-sm font-bold text-slate-900">Share with friends</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleShare('facebook')}
                    className="flex-1 h-10 rounded-xl bg-slate-50 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                  >
                    <Facebook className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleShare('twitter')}
                    className="flex-1 h-10 rounded-xl bg-slate-50 flex items-center justify-center hover:bg-sky-50 hover:text-sky-500 transition-colors"
                  >
                    <Twitter className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleShare('email')}
                    className="flex-1 h-10 rounded-xl bg-slate-50 flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Link copied!");
                    }}
                    className="flex-1 h-10 rounded-xl bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                <div className="flex gap-3">
                  <div className="bg-amber-100 p-2 rounded-lg h-fit">
                    <SparklesIcon className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-900">Limited Availability</p>
                    <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                      This event is popular in {city?.name ?? citySlug}. We recommend booking early to secure your spot!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Events */}
        <div className="mt-16 pt-16 border-t border-slate-100">
          <SimilarEvents eventId={event.id} category={event.category} citySlug={event.citySlug} />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

function SparklesIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
