"use client";

import { useRouter } from "next/navigation";
import {
  Calendar, MapPin, Clock, Users, Share2, Bookmark,
  Ticket, ArrowLeft, AlertCircle, Loader2, Tag,
  ExternalLink, Star, ChevronRight, Home, FileText,
  CheckCircle2, AlertTriangle, Info, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Footer from "@/components/Footer";
import { CITIES } from "@/lib/events-data";
import CalendarButton from "@/components/CalendarButton";
import EventCard from "@/components/EventCard";

// ── Refined Highlight Row ──────────────────────────────────────────────────
function HighlightRow({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="w-9 h-9 rounded-xl bg-indigo-50/50 flex items-center justify-center shrink-0">
        <Icon className="w-4.5 h-4.5 text-indigo-600" />
      </div>
      <p className="text-sm font-semibold text-gray-900 leading-tight">{label}</p>
    </div>
  );
}

export default function EventDetailPage({ citySlug, eventSlug }: { citySlug?: string; eventSlug?: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isInterested, setIsInterested] = useState(false);

  const { data: event, isLoading: eventLoading } = trpc.events.getBySlug.useQuery(
    { citySlug: citySlug ?? "", eventSlug: eventSlug ?? "" },
    { enabled: !!citySlug && !!eventSlug }
  );

  const { data: savedStatus } = trpc.savedEvents.isSaved.useQuery(
    { eventId: event?.id ?? "" },
    { enabled: !!user && !!event?.id }
  );

  const { data: similarEvents = [] } = trpc.events.getSimilar.useQuery(
    { eventId: event?.id ?? "", category: event?.category ?? "", citySlug: citySlug ?? "", limit: 6 },
    { enabled: !!event?.id }
  );

  useEffect(() => {
    if (savedStatus !== undefined) setIsSaved(savedStatus);
  }, [savedStatus]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: event?.title, url: window.location.href });
      } catch (err) { /* ignore */ }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  if (eventLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  if (!event || !citySlug) return null;

  const city = CITIES.find((c) => c.slug === citySlug);
  const isFree = event.price === "Free" || !event.price;
  const displayPrice = isFree ? "Free" : event.price;

  // Clean Tag Logic
  const tags: string[] = Array.isArray(event.tags) 
    ? event.tags 
    : typeof event.tags === 'string' 
      ? event.tags.replace(/[\[\]"0]/g, '').split(',').map(t => t.trim()).filter(t => t && t !== '0')
      : [];

  const dateParts = event.date?.split(" ") ?? [];
  const dateDay = dateParts[1] ?? "";
  const dateMonth = dateParts[2] ?? "";

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-24 lg:pb-12">
      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-4">
        <nav className="flex items-center gap-2 text-xs font-medium text-gray-400">
          <button onClick={() => router.push("/")} className="hover:text-indigo-600 transition-colors">Home</button>
          <ChevronRight className="w-3 h-3" />
          <button onClick={() => router.push(`/${citySlug}`)} className="hover:text-indigo-600 capitalize">{city?.name}</button>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-900 truncate max-w-[200px]">{event.title}</span>
        </nav>
      </div>

      <main className="max-w-6xl mx-auto px-4">
        {/* Title Section (Above Image) */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {event.isFeatured && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                <Star className="w-3 h-3 mr-1 fill-amber-500" /> Featured Event
              </Badge>
            )}
            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-none capitalize px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
              {event.category}
            </Badge>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-[1.1] mb-4">
            {event.title}
          </h1>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-sm">
              {((event as any).organizerName ?? "L")[0]}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-none">{(event as any).organizerName ?? "LocalEvents Host"}</p>
              {(event as any).isVerified !== false && (
                <div className="flex items-center gap-1 mt-1">
                  <div className="bg-blue-500 rounded-full p-0.5">
                    <Check className="w-2 h-2 text-white stroke-[4]" />
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">Verified Organizer</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 16:9 Hero Image */}
        <div className="relative aspect-video w-full overflow-hidden rounded-3xl shadow-2xl mb-8 group">
          {!imgError && event.image ? (
            <img src={event.image} alt={event.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" onError={() => setImgError(true)} />
          ) : (
            <div className="w-full h-full bg-indigo-50 flex items-center justify-center"><Calendar className="w-20 h-20 text-indigo-100" /></div>
          )}
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Quick Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-2 rounded-3xl border border-gray-100 shadow-sm">
              <div className="px-4"><HighlightRow icon={Calendar} label={event.date} /></div>
              <div className="px-4"><HighlightRow icon={Clock} label={event.time} /></div>
              <div className="px-4"><HighlightRow icon={MapPin} label={event.venue} /></div>
              <div className="px-4"><HighlightRow icon={Users} label={`${event.interested ?? 42}+ Interested`} /></div>
            </div>

            {/* Action Buttons (Mobile only) */}
            <div className="flex gap-3 lg:hidden">
              <Button 
                onClick={() => setIsInterested(!isInterested)}
                className={`flex-1 h-12 rounded-2xl font-bold transition-all ${isInterested ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50'}`} 
                variant="outline"
              >
                <Users className={`w-4 h-4 mr-2 ${isInterested ? 'fill-green-600' : ''}`} />
                {isInterested ? "I'm Going!" : "Interested"}
              </Button>
              <Button onClick={handleShare} variant="outline" className="h-12 w-12 rounded-2xl border-gray-200">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>

            {/* About Section */}
            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-4">About this event</h3>
              <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line">{event.description || "No description provided by host."}</p>
              
              <div className="flex flex-wrap gap-2 mt-6">
                {tags.map(tag => (
                  <span key={tag} className="px-4 py-1.5 bg-gray-50 text-gray-500 rounded-full text-sm font-medium hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-default">
                    #{tag}
                  </span>
                ))}
              </div>
            </section>

            {/* Venue Card */}
            <div className="bg-gray-50 rounded-3xl p-6 flex flex-col md:flex-row gap-6 items-center">
              <div className="w-full md:w-1/3 aspect-square rounded-2xl bg-gray-200 overflow-hidden">
                 <iframe width="100%" height="100%" frameBorder="0" src={`https://www.google.com/maps?q=${encodeURIComponent(event.venue + " " + city?.name)}&output=embed`} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 text-xl mb-1">{event.venue}</h4>
                <p className="text-gray-500 mb-4">{city?.name}, {city?.province}</p>
                <Button variant="link" className="p-0 h-auto text-indigo-600 font-bold" onClick={() => window.open(`https://maps.google.com/?q=${event.venue}`)}>
                  Get Directions <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>

          {/* Desktop Sidebar */}
          <aside className="hidden lg:block lg:col-span-4">
            <div className="sticky top-8 space-y-4">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 space-y-6">
                <div>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Entry Fee</p>
                  <p className="text-4xl font-black text-gray-900">{displayPrice}</p>
                </div>

                <Button onClick={() => {}} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-lg font-bold shadow-lg shadow-indigo-100">
                  <Ticket className="w-5 h-5 mr-2" /> Book Tickets
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsInterested(!isInterested)}
                    className={`h-12 rounded-xl font-bold ${isInterested ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-100'}`}
                  >
                    <Users className="w-4 h-4 mr-2" /> {isInterested ? "Going" : "Interested"}
                  </Button>
                  <Button variant="outline" onClick={handleShare} className="h-12 rounded-xl border-gray-100 font-bold">
                    <Share2 className="w-4 h-4 mr-2" /> Share
                  </Button>
                </div>

                <CalendarButton event={{ ...event, description: event.description ?? "" }} />

                <div className="pt-4 border-t border-gray-50">
                   <Button variant="ghost" onClick={() => setIsSaved(!isSaved)} className="w-full text-gray-500 hover:text-indigo-600 font-bold">
                     <Bookmark className={`w-4 h-4 mr-2 ${isSaved ? 'fill-indigo-600 text-indigo-600' : ''}`} />
                     {isSaved ? "Saved to Library" : "Save for Later"}
                   </Button>
                </div>
              </div>

              <div className="p-4 text-center">
                <p className="text-xs text-gray-400">Listed by verified LocalEvents host. <br/> Secure payment guaranteed.</p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Mobile Sticky Bar (Only visible when sidebar is not) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/80 backdrop-blur-xl border-t border-gray-100 p-4 flex items-center justify-between shadow-2xl">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase">From</p>
          <p className="text-xl font-black text-gray-900">{displayPrice}</p>
        </div>
        <Button className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold">
          Get Tickets
        </Button>
      </div>
    </div>
  );
}
