"use client";

import { useRouter } from "next/navigation";
import {
  Calendar, MapPin, Clock, Users, Ticket,
  ArrowLeft, AlertCircle, Loader2, Tag,
  Star, FileText, CheckCircle2, AlertTriangle,
  Info, BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Footer from "@/components/Footer";
import { City } from "@/types/trpc";
import CalendarButton from "@/components/CalendarButton";
import EventCard from "@/components/EventCard";
import TicketCheckoutModal from "@/components/TicketCheckoutModal";

import { EventDetailBreadcrumb } from "./EventDetailBreadcrumb";
import { HighlightRow, InterestedButton, SaveButton, ShareButton } from "./EventDetailShared";
import { EventDetailSidebar } from "./EventDetailSidebar";
import { EventDetailMap } from "./EventDetailMap";
import type { Tier, CalendarEventType } from "./types";

interface Props { citySlug?: string; eventSlug?: string; }

function ErrorState({ icon, title, action }: {
  icon?: React.ReactNode; title: string; action: React.ReactNode;
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

export default function EventDetailPage({ citySlug, eventSlug }: Props) {
  const router = useRouter();
  const { user } = useAuth();

  const [isSaved, setIsSaved] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isInterested, setIsInterested] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedTierId, setSelectedTierId] = useState<number | undefined>(undefined);
  const [quantity] = useState(1);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [citySlug, eventSlug]);

  const { data: event, isLoading } = trpc.events.getBySlug.useQuery(
    { citySlug: citySlug ?? "", eventSlug: eventSlug ?? "" },
    { enabled: !!citySlug && !!eventSlug }
  );
  const { data: tiers = [] } = trpc.ticketTiers.getByEvent.useQuery(
    { eventId: event?.id ?? "" },
    { enabled: !!event?.id }
  );
  const { data: savedStatus } = trpc.savedEvents.isSaved.useQuery(
    { eventId: event?.id ?? "" },
    { enabled: !!user && !!event?.id }
  );
  const { data: similarEvents = [] } = trpc.events.getSimilar.useQuery(
    { eventId: event?.id ?? "", category: event?.category ?? "", citySlug: citySlug ?? "", limit: 8 },
    { enabled: !!event?.id && !!event?.category && !!citySlug }
  );
  const { data: cities = [] } = trpc.events.getCities.useQuery();
  const city = (cities as City[]).find((c) => c.slug === citySlug);

  useEffect(() => {
    if (tiers.length > 0 && !selectedTierId) setSelectedTierId((tiers as Tier[])[0].id);
  }, [tiers, selectedTierId]);

  useEffect(() => {
    if (savedStatus !== undefined) setIsSaved(savedStatus);
  }, [savedStatus]);

  const saveMutation = trpc.savedEvents.save.useMutation();
  const unsaveMutation = trpc.savedEvents.unsave.useMutation();

  const handleSave = async () => {
    if (!user || !event) return;
    try {
      if (isSaved) {
        await unsaveMutation.mutateAsync({ eventId: event.id });
        setIsSaved(false);
      } else {
        await saveMutation.mutateAsync({
          eventId: event.id,
          eventTitle: event.title,
          eventDate: event.date,
          eventCity: event.citySlug,
        });
        setIsSaved(true);
      }
    } catch { /* silent */ }
  };

  const handleGetTickets = () => {
    if (!user) {
      router.push(`/sign-in?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setShowCheckout(true);
  };

  if (isLoading) return (
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
  const interestedCount = typeof event.interested === "number" && event.interested > 0 ? event.interested : null;
  const organizerName = (event as any).organizerName ?? "LocalEvents Team";
  const isVerified = !!(event as any).isVerified || !!(event as any).organizerVerified;

  const isValidTag = (t: string) => t.trim().length > 0 && !/^\d+$/.test(t.trim());
  const tags: string[] = (() => {
    const raw = event.tags;
    if (!raw) return [];
    if (Array.isArray(raw)) return (raw as string[]).map((t) => String(t).trim()).filter(isValidTag);
    const str = String(raw).trim();
    if (str.startsWith("[")) {
      try {
        const p = JSON.parse(str);
        if (Array.isArray(p)) return p.map((t: unknown) => String(t).trim()).filter(isValidTag);
      } catch { /* fall */ }
    }
    return str.split(",").map((t) => t.trim()).filter(isValidTag);
  })();

  const calendarEvent: CalendarEventType = {
    title: event.title,
    description: event.description ?? null,
    date: typeof event.date === "string" ? event.date : (event.date as Date).toLocaleDateString("en-CA"),
    time: event.time,
    venue: event.venue,
  };

  const dateParts = event.date?.split(" ") ?? [];
  const dateDay = dateParts[1] ?? "";
  const dateMonth = dateParts[2] ?? "";

  const sidebarProps = {
    isFree, displayPrice,
    tiers: tiers as Tier[],
    selectedTierId, onSelectTier: setSelectedTierId,
    isSaved, onSave: handleSave,
    eventTitle: event.title,
    user, onGetTickets: handleGetTickets,
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8]">

      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-3">
        <EventDetailBreadcrumb citySlug={citySlug!} cityName={city.name} eventTitle={event.title} />
      </div>

      {/* Hero image */}
      <div className="w-full bg-gray-100" style={{ aspectRatio: "16/9", maxHeight: 480, overflow: "hidden" }}>
        {!imgError && event.image ? (
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover object-center block"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-100 via-amber-50 to-indigo-50 flex items-center justify-center">
            <Calendar className="w-20 h-20 text-indigo-200" />
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-28 lg:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 lg:gap-12 items-start">

          {/* ── LEFT column ── */}
          <div>
            {/* Title block */}
            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {!!event.isFeatured && event.isFeatured !== 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full">
                    <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />Featured
                  </span>
                )}
                <span className="text-[11px] font-medium text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full capitalize">
                  {event.category}
                </span>
                {isFree && (
                  <span className="text-[11px] font-medium text-green-600 bg-green-50 border border-green-100 px-2.5 py-0.5 rounded-full">
                    Free Entry
                  </span>
                )}
              </div>

              <h1
                className="text-3xl sm:text-4xl lg:text-[2.6rem] font-bold text-gray-950 leading-tight mb-3"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                {event.title}
              </h1>

              <div className="flex items-center gap-2 flex-wrap">
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
            </div>

            {/* Interested + Share */}
            <div className="flex items-stretch gap-2.5 mb-8">
              <InterestedButton
                isInterested={isInterested}
                onToggle={() => setIsInterested((v) => !v)}
                className="flex-1"
              />
              <ShareButton eventTitle={event.title} variant="full" />
            </div>

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
              <h2 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-5">
                Date &amp; Location
              </h2>
              <div className="flex items-start gap-4 mb-6">
                <div className="w-11 h-11 rounded-xl bg-indigo-600 flex flex-col items-center justify-center shrink-0 text-white">
                  <span className="text-[9px] font-bold uppercase leading-none opacity-70">{dateMonth}</span>
                  <span className="text-base font-bold leading-tight">{dateDay}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{event.date} · {event.time}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Approx. 2 hours</p>
                  <div className="mt-3"><CalendarButton event={calendarEvent} /></div>
                </div>
              </div>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{event.venue}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{city.name}, {city.province}, {city.country}</p>
                </div>
              </div>
            </section>

            <div className="border-t border-gray-100 mb-8" />

            {/* About */}
            <section className="mb-8">
              <h2 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-4">
                About the event
              </h2>
              {event.description
                ? <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{event.description}</p>
                : <p className="text-gray-400 text-sm italic">No description available.</p>
              }
            </section>

            <div className="border-t border-gray-100 mb-8" />

            {/* Map */}
            <section className="mb-8">
              <h2 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Venue location
              </h2>
              <EventDetailMap
                venue={event.venue}
                cityName={city.name}
                cityLat={city.lat}
                cityLng={city.lng}
              />
            </section>

            {/* Tags */}
            {tags.length > 0 && (
              <>
                <div className="border-t border-gray-100 mb-6" />
                <section className="mb-8">
                  <h2 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Event tags
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span key={tag} className="text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1 capitalize">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </section>
              </>
            )}

            <div className="border-t border-gray-100 mb-8" />

            {/* Terms & Conditions */}
            <section className="mb-2">
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-gray-400" />
                  <h2 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Terms &amp; Conditions
                  </h2>
                </div>
                <div className="px-5 py-4 space-y-4">
                  {[
                    { icon: CheckCircle2, color: "text-green-500", title: "Ticket Policy", body: "All ticket sales are final. No refunds or exchanges unless the event is cancelled or rescheduled by the organizer." },
                    { icon: CheckCircle2, color: "text-green-500", title: "Entry Requirements", body: "Valid ID may be required. Tickets must be presented digitally or printed at the door." },
                    { icon: AlertTriangle, color: "text-amber-500", title: "Age Restrictions", body: "Some events may have age restrictions. Please verify event details before purchasing tickets." },
                    { icon: Info, color: "text-gray-400", title: "Event Changes", body: "The organizer reserves the right to make changes to the lineup or schedule." },
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

          {/* ── RIGHT sidebar (desktop only) ── */}
          {/*
            STICKY FIX: Do NOT use inline style position:sticky — Tailwind's
            sticky class is processed differently and avoids the overflow:hidden
            ancestor issue common in Next.js app router layouts.
            Adjust the top-[Xpx] value to match your navbar height exactly.
          */}
          <div className="hidden lg:block">
            <div className="sticky top-[80px]">
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
                <EventDetailSidebar {...sidebarProps} />
              </div>
            </div>
          </div>

        </div>{/* end grid */}

        {/* Similar events */}
        {(similarEvents as any[]).length > 0 && (
          <section className="mt-12 pt-8 border-t border-gray-100">
            <h2
              className="text-base font-bold text-gray-900 mb-4"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              More events like this ✨
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 snap-x snap-mandatory scrollbar-hide">
              {(similarEvents as any[]).map((e) => (
                <div key={e.id} className="shrink-0 w-[200px] sm:w-[220px] snap-start">
                  <EventCard event={e} citySlug={citySlug} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <Footer />

      {/* Mobile bottom bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-[0_-4px_24px_oklch(0.2_0.01_80/0.08)] px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium leading-none mb-0.5">From</p>
            <p className={`text-lg font-bold leading-tight ${isFree ? "text-green-600" : "text-gray-900"}`}>
              {displayPrice}
            </p>
          </div>
          <SaveButton isSaved={isSaved} onSave={handleSave} variant="icon-only" />
          <Button
            onClick={handleGetTickets}
            className="h-10 px-5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl text-sm flex items-center gap-2 shrink-0"
          >
            <Ticket className="w-4 h-4" />Get Tickets
          </Button>
        </div>
      </div>

      {/* Checkout modal */}
      <TicketCheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        eventId={event.id}
        eventTitle={event.title}
        price={event.price}
        tierId={selectedTierId}
        quantity={quantity}
        onSuccess={() => router.push("/account/tickets")}
      />
    </div>
  );
}