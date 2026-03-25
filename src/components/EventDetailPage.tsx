"use client";

import { useRouter } from "next/navigation";
import {
  Calendar, MapPin, Clock, Users, Share2, Bookmark,
  Ticket, ArrowLeft, AlertCircle, Loader2, Tag,
  ExternalLink, Star, ChevronRight, Home, FileText,
  CheckCircle2, AlertTriangle, Info, Twitter, Facebook,
  Link2, MessageCircle, X, BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useRef } from "react";
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

// Social share panel
function ShareMenu({ eventTitle, onClose }: { eventTitle: string; onClose: () => void }) {
  const url = typeof window !== "undefined" ? window.location.href : "";
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(eventTitle);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* silent */ }
  };

  const socials = [
    {
      label: "Twitter / X",
      icon: Twitter,
      color: "hover:bg-black hover:text-white",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      label: "Facebook",
      icon: Facebook,
      color: "hover:bg-blue-600 hover:text-white",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      label: "WhatsApp",
      icon: MessageCircle,
      color: "hover:bg-green-500 hover:text-white",
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    },
  ];

  return (
    <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 w-60 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Share event</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="p-2 space-y-0.5">
        {socials.map(({ label, icon: Icon, color, href }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 transition-all ${color}`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </a>
        ))}
        <button
          onClick={handleCopy}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${copied ? "bg-green-50 text-green-700" : "text-gray-700 hover:bg-gray-50"}`}
        >
          <Link2 className="w-4 h-4" />
          {copied ? "Link copied!" : "Copy link"}
        </button>
      </div>
    </div>
  );
}

// Interested button with animation
function InterestedButton({
  isInterested,
  onToggle,
  className = "",
  size = "default",
}: {
  isInterested: boolean;
  onToggle: () => void;
  className?: string;
  size?: "default" | "sm";
}) {
  const [burst, setBurst] = useState(false);

  const handleClick = () => {
    if (!isInterested) {
      setBurst(true);
      setTimeout(() => setBurst(false), 500);
    }
    onToggle();
  };

  return (
    <button
      onClick={handleClick}
      className={`relative flex items-center justify-center gap-2 font-semibold rounded-xl border transition-all duration-200 select-none
        ${size === "sm" ? "h-10 px-4 text-sm" : "h-11 px-5 text-sm"}
        ${isInterested
          ? "bg-indigo-700 border-indigo-700 text-white shadow-md shadow-indigo-200"
          : "bg-white border-gray-200 text-gray-700 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50"
        }
        ${className}
        active:scale-95`}
    >
      {/* Burst ring */}
      {burst && (
        <span className="absolute inset-0 rounded-xl animate-ping bg-indigo-400 opacity-25 pointer-events-none" />
      )}
      <Users className={`w-4 h-4 transition-transform ${burst ? "scale-110" : ""}`} />
      {isInterested ? "Interested ✓" : "I'm Interested"}
    </button>
  );
}

export default function EventDetailPage({ citySlug, eventSlug }: EventDetailPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isInterested, setIsInterested] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [citySlug, eventSlug]);

  // Close share menu on outside click
  useEffect(() => {
    if (!showShareMenu) return;
    const handler = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShowShareMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showShareMenu]);

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

  // Only show interested count if truly > 0
  const interestedCount = typeof event.interested === "number" && event.interested > 0 ? event.interested : null;

  // Parse tags — filter out empty strings and bare numbers like "0"
  const tags: string[] = (() => {
    const raw = event.tags;
    if (!raw) return [event.category];
    if (Array.isArray(raw)) return raw.filter((t) => t && !/^\d+$/.test(String(t).trim()));
    const str = String(raw).trim();
    if (str.startsWith("[")) {
      try {
        const parsed = JSON.parse(str);
        if (Array.isArray(parsed))
          return parsed.map((t) => String(t).trim()).filter((t) => t && !/^\d+$/.test(t));
      } catch { /* fall through */ }
    }
    return str.split(",").map((t) => t.trim()).filter((t) => t && !/^\d+$/.test(t));
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

  // Verified status — adapt to your actual data model
  const isVerified = !!(event as any).isVerified || !!(event as any).organizerVerified;
  const organizerName = (event as any).organizerName ?? "LocalEvents Team";

  // ── Sidebar ticket card ────────────────────────────────────────────────────
  const TicketSidebar = () => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-6 space-y-3">
      {/* Price */}
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5">Tickets from</p>
        <p className={`text-3xl font-bold ${isFree ? "text-green-600" : "text-indigo-900"}`}>
          {displayPrice}
        </p>
        {!isFree && <p className="text-xs text-gray-400 mt-0.5">Per person · No hidden fees</p>}
      </div>

      {/* Get Tickets — primary CTA */}
      <a
        href={event.ticketUrl ?? "#"}
        target={event.ticketUrl ? "_blank" : undefined}
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full h-12 bg-indigo-700 hover:bg-indigo-800 active:scale-[0.98] text-white font-bold rounded-xl transition-all duration-150 shadow-md shadow-indigo-200 text-sm"
      >
        <Ticket className="w-4 h-4" />
        Get Tickets
        {event.ticketUrl && <ExternalLink className="w-3 h-3 opacity-70" />}
      </a>

      {/* Add to Calendar */}
      <div className="[&>*]:w-full [&>*]:rounded-xl [&>*]:border-gray-200 [&>*]:text-gray-700 [&>*]:h-10">
        <CalendarButton event={calendarEvent} />
      </div>

      <InterestedButton
        isInterested={isInterested}
        onToggle={() => setIsInterested((v) => !v)}
        className="w-full"
      />

      {/* Share */}
      <div className="relative" ref={shareRef}>
        <button
          onClick={() => setShowShareMenu((v) => !v)}
          className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-colors"
        >
          <Share2 className="w-4 h-4" />Share Event
        </button>
        {showShareMenu && (
          <ShareMenu eventTitle={event.title} onClose={() => setShowShareMenu(false)} />
        )}
      </div>

      {/* Save */}
      <button
        onClick={handleSaveEvent}
        className={`w-full flex items-center justify-center gap-2 h-10 rounded-xl border font-semibold text-sm transition-all
          ${isSaved ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
      >
        <Bookmark className={`w-4 h-4 transition-all ${isSaved ? "fill-indigo-600 text-indigo-600 scale-110" : ""}`} />
        {isSaved ? "Saved" : "Save for later"}
      </button>

      <p className="text-center text-xs text-gray-300 pt-0.5">Secure checkout · LocalEvents</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-24 lg:pb-0">

      {/* Breadcrumb */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-3">
        <Breadcrumb citySlug={citySlug!} cityName={city.name} eventTitle={event.title} />
      </div>

      {/* Hero image — strict 16:9 */}
      <div className="w-full" style={{ aspectRatio: "16/9", maxHeight: 520, overflow: "hidden" }}>
        {!imgError && event.image ? (
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover object-center"
            style={{ display: "block" }}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-100 via-amber-50 to-indigo-50 flex items-center justify-center">
            <Calendar className="w-20 h-20 text-indigo-200" />
          </div>
        )}
      </div>

      {/* Title block */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 pb-1">

        {/* Badges row — Featured first */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {event.isFeatured && (
            <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-xs">
              <Star className="w-3 h-3 mr-1 fill-amber-500 text-amber-500 inline" />Featured
            </Badge>
          )}
          <Badge className="bg-gray-100 text-gray-600 border-0 text-xs capitalize">{event.category}</Badge>
          {isFree && <Badge className="bg-green-50 text-green-700 border border-green-100 text-xs">Free Entry</Badge>}
          {tags.map((tag) => (
            <span key={tag} className="text-xs font-medium text-gray-500 bg-gray-100 rounded-full px-3 py-0.5 capitalize">
              #{tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <h1
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black leading-tight mb-4"
          style={{ fontFamily: "'Sora', sans-serif" }}
        >
          {event.title}
        </h1>

        {/* Organizer row — below title */}
        <div className="flex items-center gap-2 text-sm">
          <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {organizerName[0].toUpperCase()}
          </div>
          <span className="font-medium text-gray-600">{organizerName}</span>
          {isVerified && (
            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-600 text-xs font-semibold px-2 py-0.5 rounded-full border border-indigo-100">
              <BadgeCheck className="w-3.5 h-3.5 fill-indigo-600 text-white" />
              Verified
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="lg:grid lg:grid-cols-3 lg:gap-10 lg:items-start">

          {/* ══ LEFT COLUMN ════════════════════════════════════════════════ */}
          <div className="lg:col-span-2 space-y-5">

            {/* Quick highlights */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-1">
              <HighlightRow icon={Calendar} label={event.date} />
              <HighlightRow icon={Clock} label={event.time} />
              <HighlightRow icon={MapPin} label={event.venue} />
              <HighlightRow icon={Tag} label={isFree ? "Free Entry" : `${displayPrice} per person`} />
              {interestedCount && (
                <HighlightRow icon={Users} label={`${interestedCount}+ people interested`} />
              )}
            </div>

            {/* Quick actions — Interested + Share only (no Book Tickets) */}
            <div className="flex gap-2.5">
              <InterestedButton
                isInterested={isInterested}
                onToggle={() => setIsInterested((v) => !v)}
                className="flex-1"
              />
              <div className="relative flex-1" ref={shareRef}>
                <button
                  onClick={() => setShowShareMenu((v) => !v)}
                  className="w-full h-10 flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-colors"
                >
                  <Share2 className="w-4 h-4" />Share
                </button>
                {showShareMenu && (
                  <ShareMenu eventTitle={event.title} onClose={() => setShowShareMenu(false)} />
                )}
              </div>
            </div>

            {/* Date & Location */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-50">
                <h2 className="font-semibold text-gray-500 text-xs uppercase tracking-wider">Date &amp; Location</h2>
              </div>

              {/* Date row */}
              <div className="px-5 py-4 flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-indigo-700 flex flex-col items-center justify-center shrink-0 text-white">
                  <span className="text-[9px] font-bold uppercase leading-none opacity-70">{dateMonth}</span>
                  <span className="text-base font-bold leading-tight">{dateDay}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{event.date} · {event.time}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Approx. 2 hours</p>
                  <div className="mt-3 max-w-xs">
                    <CalendarButton event={calendarEvent} />
                  </div>
                </div>
              </div>

              {/* Location row — no extra divider */}
              <div className="px-5 pb-4 flex items-start gap-4">
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
              <h2 className="font-semibold text-gray-500 text-xs uppercase tracking-wider mb-3">About the event</h2>
              {event.description ? (
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{event.description}</p>
              ) : (
                <p className="text-gray-400 text-sm italic">No description available.</p>
              )}
            </div>

            {/* Terms & Conditions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-gray-400" />
                <h2 className="font-semibold text-gray-500 text-xs uppercase tracking-wider">Terms &amp; Conditions</h2>
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

          {/* ══ RIGHT COLUMN: sticky sidebar — desktop only ════════════════ */}
          <div className="hidden lg:block lg:col-span-1">
            <TicketSidebar />
          </div>

        </div>
      </div>

      <Footer />

      {/* Mobile sticky bottom bar — only visible when sidebar is hidden */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/95 backdrop-blur-sm border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 leading-none mb-0.5">Tickets from</p>
          <p className={`text-lg font-bold leading-tight ${isFree ? "text-green-600" : "text-indigo-900"}`}>{displayPrice}</p>
        </div>
        <button
          onClick={handleSaveEvent}
          className={`h-10 w-10 shrink-0 flex items-center justify-center rounded-xl border transition-all ${isSaved ? "border-indigo-200 bg-indigo-50" : "border-gray-200 bg-white"}`}
        >
          <Bookmark className={`w-4 h-4 transition-all ${isSaved ? "fill-indigo-600 text-indigo-600 scale-110" : "text-gray-400"}`} />
        </button>
        <a
          href={event.ticketUrl ?? "#"}
          target={event.ticketUrl ? "_blank" : undefined}
          rel="noopener noreferrer"
          className="h-10 px-5 flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 active:scale-95 text-white font-bold text-sm rounded-xl shrink-0 transition-all"
        >
          <Ticket className="w-4 h-4" />
          Get Tickets
        </a>
      </div>
    </div>
  );
}
