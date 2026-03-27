"use client";

import { useRouter } from "next/navigation";
import {
  Calendar, MapPin, Clock, Users, Share2, Bookmark,
  Ticket, ArrowLeft, AlertCircle, Loader2, Tag,
  ExternalLink, Star, ChevronRight, Home, FileText,
  CheckCircle2, AlertTriangle, Info, Twitter, Facebook,
  Link2, MessageCircle, BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import Footer from "@/components/Footer";
import { CITIES } from "@/lib/events-data";
import CalendarButton from "@/components/CalendarButton";
import EventCard from "@/components/EventCard";

interface EventDetailPageProps {
  citySlug?: string;
  eventSlug?: string;
}

/* ─── Error state ─────────────────────────────────────────────────────────── */
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

/* ─── Breadcrumb ──────────────────────────────────────────────────────────── */
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

/* ─── Highlight row ───────────────────────────────────────────────────────── */
function HighlightRow({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-indigo-500" />
      </div>
      <p className="text-sm text-gray-800 leading-tight">{label}</p>
    </div>
  );
}

/* ─── Share button — always click to open, outside click to close ─────────── */
function ShareButton({ eventTitle, fullWidth = false }: { eventTitle: string; fullWidth?: boolean }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const url = typeof window !== "undefined" ? window.location.href : "";
  const enc = encodeURIComponent(url);
  const encTitle = encodeURIComponent(eventTitle);

  const socials = [
    { label: "Twitter / X", icon: Twitter, bg: "hover:bg-black hover:text-white", href: `https://twitter.com/intent/tweet?url=${enc}&text=${encTitle}` },
    { label: "Facebook",    icon: Facebook, bg: "hover:bg-blue-600 hover:text-white", href: `https://www.facebook.com/sharer/sharer.php?u=${enc}` },
    { label: "WhatsApp",   icon: MessageCircle, bg: "hover:bg-green-500 hover:text-white", href: `https://wa.me/?text=${encTitle}%20${enc}` },
  ];

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* silent */ }
  };

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className={`relative ${fullWidth ? "w-full" : ""}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl border font-semibold text-sm transition-colors duration-150
          ${fullWidth ? "w-full" : ""}
          ${open ? "bg-gray-50 border-gray-300 text-gray-800" : "border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800"}`}
      >
        <Share2 className="w-4 h-4" />Share
      </button>

      {open && (
        <div className="absolute left-0 top-full pt-1.5 z-50">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 w-52 overflow-hidden">
            {socials.map(({ label, icon: Icon, bg, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors ${bg}`}
              >
                <Icon className="w-4 h-4 shrink-0" />{label}
              </a>
            ))}
            <button
              onClick={handleCopy}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors border-t border-gray-50
                ${copied ? "text-green-700 bg-green-50" : "text-gray-700 hover:bg-gray-50"}`}
            >
              <Link2 className="w-4 h-4 shrink-0" />{copied ? "Copied!" : "Copy link"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Interested button — truly fixed size, text never causes reflow ─────── */
function InterestedButton({ isInterested, onToggle, className = "" }: { isInterested: boolean; onToggle: () => void; className?: string }) {
  return (
    <button
      onClick={onToggle}
      style={{ width: "9.5rem", minWidth: "9.5rem", maxWidth: "9.5rem" }}
      className={`relative flex items-center justify-center gap-2 h-10 rounded-xl border font-semibold text-sm transition-colors duration-150 select-none overflow-hidden
        ${isInterested
          ? "bg-indigo-700 border-indigo-700 text-white"
          : "border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50"
        } ${className}`}
    >
      <Users className="w-4 h-4 shrink-0" />
      {/* Both labels always rendered, visibility toggled — width never changes */}
      <span className={isInterested ? "block" : "hidden"}>Interested ✓</span>
      <span className={isInterested ? "hidden" : "block"}>I'm Interested</span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function EventDetailPage({ citySlug, eventSlug }: EventDetailPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isInterested, setIsInterested] = useState(false);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "auto" }); }, [citySlug, eventSlug]);

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

  useEffect(() => { if (savedStatus !== undefined) setIsSaved(savedStatus); }, [savedStatus]);

  const saveEventMutation = trpc.savedEvents.save.useMutation();
  const unsaveEventMutation = trpc.savedEvents.unsave.useMutation();

  const handleSaveEvent = async () => {
    if (!user || !event) return;
    try {
      if (isSaved) { await unsaveEventMutation.mutateAsync({ eventId: event.id }); setIsSaved(false); }
      else { await saveEventMutation.mutateAsync({ eventId: event.id, eventTitle: event.title, eventDate: event.date, eventCity: event.citySlug }); setIsSaved(true); }
    } catch { /* silent */ }
  };

  const city = CITIES.find((c) => c.slug === citySlug);

  if (eventLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  if (!city) return <ErrorState icon={<AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />} title="City not found" action={<Button onClick={() => router.push("/")} className="bg-indigo-700 hover:bg-indigo-800"><ArrowLeft className="w-4 h-4 mr-2" />Back to Home</Button>} />;
  if (!event) return <ErrorState icon={<AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />} title="Event not found" action={<Button onClick={() => router.push(`/${citySlug}`)} className="bg-indigo-700 hover:bg-indigo-800"><ArrowLeft className="w-4 h-4 mr-2" />Back to {city.name}</Button>} />;

  const isFree = event.price === "Free" || event.price === null;
  const displayPrice = isFree ? "Free" : event.price;
  const interestedCount = typeof event.interested === "number" && event.interested > 0 ? event.interested : null;
  const isVerified = !!(event as any).isVerified || !!(event as any).organizerVerified;
  const organizerName = (event as any).organizerName ?? "LocalEvents Team";
  const ticketUrl = (event as any).ticketUrl as string | undefined;

  // Clean tags — strip bare numbers ("0", "1" etc)
  const isValidTag = (t: string) => t.trim().length > 0 && !/^\d+$/.test(t.trim());
  const tags: string[] = (() => {
    const raw = event.tags;
    if (!raw) return [];
    if (Array.isArray(raw)) return (raw as string[]).map((t) => String(t).trim()).filter(isValidTag);
    const str = String(raw).trim();
    if (str.startsWith("[")) {
      try { const p = JSON.parse(str); if (Array.isArray(p)) return p.map((t: unknown) => String(t).trim()).filter(isValidTag); } catch { /* fall */ }
    }
    return str.split(",").map((t) => t.trim()).filter(isValidTag);
  })();

  const calendarEvent = {
    title: event.title,
    description: event.description ?? null,
    date: typeof event.date === "string" ? event.date : (event.date as Date).toLocaleDateString("en-CA"),
    time: event.time,
    venue: event.venue,
  };

  const dateParts = event.date?.split(" ") ?? [];
  const dateDay = dateParts[1] ?? "";
  const dateMonth = dateParts[2] ?? "";

  /* ── Sidebar component ──────────────────────────────────────────────────── */
  const Sidebar = () => (
    <div className="sticky top-6 space-y-2">
      <div className="pb-4 border-b border-gray-100">
        <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium mb-1">Tickets from</p>
        <p className={`text-3xl font-bold ${isFree ? "text-green-600" : "text-gray-900"}`}>{displayPrice}</p>
        {!isFree && <p className="text-xs text-gray-400 mt-0.5">Per person · No hidden fees</p>}
      </div>

      <a
        href={ticketUrl ?? "#"}
        target={ticketUrl ? "_blank" : undefined}
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full h-12 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl transition-colors text-sm"
      >
        <Ticket className="w-4 h-4" />Get Tickets
        {ticketUrl && <ExternalLink className="w-3 h-3 opacity-60" />}
      </a>

      <div className="[&>button]:w-full [&>a]:w-full">
        <CalendarButton event={calendarEvent} />
      </div>

      <InterestedButton isInterested={isInterested} onToggle={() => setIsInterested((v) => !v)} className="w-full" />

      <ShareButton eventTitle={event.title} fullWidth />

      <button
        onClick={handleSaveEvent}
        className={`w-full flex items-center justify-center gap-2 h-10 rounded-xl border font-semibold text-sm transition-colors
          ${isSaved ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
      >
        <Bookmark className={`w-4 h-4 ${isSaved ? "fill-indigo-600 text-indigo-600" : ""}`} />
        {isSaved ? "Saved" : "Save for later"}
      </button>

      <p className="text-center text-[11px] text-gray-300 pt-1">Secure checkout · LocalEvents</p>
    </div>
  );

  /* ── Main render ──────────────────────────────────────────────────────────*/
  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-24 lg:pb-0">

      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-3">
        <Breadcrumb citySlug={citySlug!} cityName={city.name} eventTitle={event.title} />
      </div>

      {/* Hero — 16:9 */}
      <div className="w-full bg-gray-100" style={{ aspectRatio: "16/9", maxHeight: 480, overflow: "hidden" }}>
        {!imgError && event.image ? (
          <img src={event.image} alt={event.title} className="w-full h-full object-cover object-center block" onError={() => setImgError(true)} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-100 via-amber-50 to-indigo-50 flex items-center justify-center">
            <Calendar className="w-20 h-20 text-indigo-200" />
          </div>
        )}
      </div>

      {/* Page body */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-12 lg:items-start">

          {/* ══ LEFT ════════════════════════════════════════════════════════ */}
          <div>

            {/* Title block */}
            <div className="mb-6">
              {/* Organizer — topmost */}
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {organizerName[0].toUpperCase()}
                </div>
                <span className="text-sm text-gray-600 font-medium">{organizerName}</span>
                {isVerified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                    <BadgeCheck className="w-3 h-3 fill-indigo-600 text-white" />Verified
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-bold text-gray-950 leading-tight mb-3" style={{ fontFamily: "'Sora', sans-serif" }}>
                {event.title}
              </h1>

              {/* Badges row — category, free, featured — all below title */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-medium text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full capitalize">{event.category}</span>
                {isFree && (
                  <span className="text-[11px] font-medium text-green-600 bg-green-50 border border-green-100 px-2.5 py-0.5 rounded-full">Free Entry</span>
                )}
                {/* Featured — only render when value is a positive number */}
                {!!event.isFeatured && event.isFeatured !== 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full">
                    <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />Featured
                  </span>
                )}
              </div>
            </div>

            {/* Quick actions — Interested + Share only (no Save) */}
            <div className="flex items-center gap-2.5 mb-8">
              <InterestedButton isInterested={isInterested} onToggle={() => setIsInterested((v) => !v)} />
              <ShareButton eventTitle={event.title} />
            </div>

            {/* ── Continuous content ── */}

            {/* Quick highlights */}
            <section className="mb-8">
              <HighlightRow icon={Calendar} label={event.date} />
              <HighlightRow icon={Clock} label={event.time} />
              <HighlightRow icon={MapPin} label={event.venue} />
              <HighlightRow icon={Tag} label={isFree ? "Free Entry" : `${displayPrice} per person`} />
              {interestedCount && <HighlightRow icon={Users} label={`${interestedCount}+ people interested`} />}
            </section>

            <div className="border-t border-gray-100 mb-8" />

            {/* Date & Location */}
            <section className="mb-8">
              <h2 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-5">Date &amp; Location</h2>

              <div className="flex items-start gap-4 mb-5">
                <div className="w-11 h-11 rounded-xl bg-indigo-600 flex flex-col items-center justify-center shrink-0 text-white">
                  <span className="text-[9px] font-bold uppercase leading-none opacity-70">{dateMonth}</span>
                  <span className="text-base font-bold leading-tight">{dateDay}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{event.date} · {event.time}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Approx. 2 hours</p>
                  <div className="mt-3">
                    <CalendarButton event={calendarEvent} />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-indigo-500" />
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
            </section>

            <div className="border-t border-gray-100 mb-8" />

            {/* About */}
            <section className="mb-8">
              <h2 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-4">About the event</h2>
              {event.description ? (
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{event.description}</p>
              ) : (
                <p className="text-gray-400 text-sm italic">No description available.</p>
              )}
            </section>

            {/* Event tags — moved up, before T&C */}
            {tags.length > 0 && (
              <>
                <div className="border-t border-gray-100 mb-6" />
                <section className="mb-8">
                  <h2 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Event tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span key={tag} className="text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1 capitalize">#{tag}</span>
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* Terms & Conditions — card at the bottom */}
            <div className="border-t border-gray-100 mb-8" />
            <section className="mb-2">
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-gray-400" />
                  <h2 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Terms &amp; Conditions</h2>
                </div>
                <div className="px-5 py-4 space-y-4">
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
            </section>

          </div>

          {/* ══ RIGHT sidebar — desktop ═════════════════════════════════════ */}
          <div className="hidden lg:block">
            <Sidebar />
          </div>

        </div>

        {/* Sidebar for non-lg viewports (shown below content) */}
        <div className="lg:hidden mt-8 pt-8 border-t border-gray-100">
          <Sidebar />
        </div>

        {/* Similar events — full width below both columns */}
        {similarEvents.length > 0 && (
          <section className="mt-8 pt-8 border-t border-gray-100">
            <h2 className="text-base font-bold text-gray-900 mb-4" style={{ fontFamily: "'Sora', sans-serif" }}>
              More events like this ✨
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {similarEvents.map((e) => (
                <EventCard key={e.id} event={e} citySlug={citySlug} />
              ))}
            </div>
          </section>
        )}
      </div>

      <Footer />

      {/* Mobile bottom bar — Tickets from | Save | Get Tickets */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/95 backdrop-blur-sm border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-gray-400 leading-none mb-0.5">Tickets from</p>
          <p className={`text-lg font-bold leading-tight ${isFree ? "text-green-600" : "text-gray-900"}`}>{displayPrice}</p>
        </div>
        <button
          onClick={handleSaveEvent}
          className={`h-10 w-10 shrink-0 flex items-center justify-center rounded-xl border transition-colors ${isSaved ? "border-indigo-200 bg-indigo-50" : "border-gray-200"}`}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? "fill-indigo-600 text-indigo-600" : "text-gray-400"}`} />
        </button>
        <a
          href={ticketUrl ?? "#"}
          target={ticketUrl ? "_blank" : undefined}
          rel="noopener noreferrer"
          className="h-10 px-5 flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-sm rounded-xl shrink-0 transition-colors"
        >
          <Ticket className="w-4 h-4" />Get Tickets
        </a>
      </div>
    </div>
  );
}
