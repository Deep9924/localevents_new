"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Ticket, ChevronLeft, ChevronRight, Bookmark } from "lucide-react";
import Image from "next/image";
import { trpc } from "@/lib/trpc";
import { AppRouter } from "@/server/routers/root";
import { inferRouterOutputs } from "@trpc/server";
import { useBookmark } from "@/hooks/useBookmark";
import { toast } from "sonner";

type RouterOutput = inferRouterOutputs<AppRouter>;
type Event = RouterOutput["events"]["getByCity"][number];

interface FeaturedEventProps {
  event: Event;
  events?: Event[];
  citySlug: string;
}

export default function FeaturedEvent({ event, events, citySlug }: FeaturedEventProps) {
  const allEvents = events?.length ? events : [event];
  const hasMultiple = allEvents.length > 1;
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [animating, setAnimating] = useState(false);
  const [imgError, setImgError] = useState(false);
  const active = allEvents[current];
  const { isSaved, handleBookmarkToggle } = useBookmark(active);
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  const goTo = (url: string) => {
    router.push(url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const slideTo = (next: number, dir: "left" | "right") => {
    if (animating) return;
    setDirection(dir);
    setPrev(current);
    setAnimating(true);
    setCurrent(next);
    setImgError(false);
    setTimeout(() => { setPrev(null); setAnimating(false); }, 500);
  };

  const goPrev = () => slideTo((current - 1 + allEvents.length) % allEvents.length, "right");
  const goNext = () => slideTo((current + 1) % allEvents.length, "left");

  useEffect(() => {
    if (!hasMultiple) return;
    const timer = setInterval(() => {
      const nextIdx = (current + 1) % allEvents.length;
      slideTo(nextIdx, "left");
      const el = scrollRef.current;
      if (el) {
        const cardWidth = el.scrollWidth / allEvents.length;
        el.scrollTo({ left: cardWidth * nextIdx, behavior: "smooth" });
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [hasMultiple, current, animating]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const cardWidth = el.scrollWidth / allEvents.length;
      const idx = Math.round(el.scrollLeft / cardWidth);
      setCurrent(Math.min(idx, allEvents.length - 1));
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [allEvents.length]);

  const scrollToCard = (i: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.scrollWidth / allEvents.length;
    el.scrollTo({ left: cardWidth * i, behavior: "smooth" });
  };

  return (
    <section className="relative py-0 sm:py-8 overflow-hidden">
      <style>{`
        @keyframes enterFromRight { from { transform: translateX(100%) } to { transform: translateX(0) } }
        @keyframes enterFromLeft  { from { transform: translateX(-100%) } to { transform: translateX(0) } }
        @keyframes exitToLeft     { from { transform: translateX(0) } to { transform: translateX(-100%) } }
        @keyframes exitToRight    { from { transform: translateX(0) } to { transform: translateX(100%) } }
        .enter-from-right { animation: enterFromRight 0.5s cubic-bezier(.4,0,.2,1) forwards }
        .enter-from-left  { animation: enterFromLeft  0.5s cubic-bezier(.4,0,.2,1) forwards }
        .exit-to-left     { animation: exitToLeft     0.5s cubic-bezier(.4,0,.2,1) forwards }
        .exit-to-right    { animation: exitToRight    0.5s cubic-bezier(.4,0,.2,1) forwards }
      `}</style>

      {/* DESKTOP */}
      <div className="hidden sm:block w-full px-12 sm:px-16 relative">
        {hasMultiple && (
          <>
            <button onClick={goPrev} className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 text-gray-300 hover:text-gray-600 transition-colors">
              <ChevronLeft className="w-7 h-7" />
            </button>
            <button onClick={goNext} className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 text-gray-300 hover:text-gray-600 transition-colors">
              <ChevronRight className="w-7 h-7" />
            </button>
          </>
        )}
        <div className="relative overflow-hidden" style={{ minHeight: 270 }}>
          {prev !== null && (
            <div className={`absolute inset-0 flex items-center gap-12 pointer-events-none ${direction === "left" ? "exit-to-left" : "exit-to-right"}`}>
              <DesktopCard ev={allEvents[prev]} citySlug={citySlug} goTo={goTo} imgError={false} setImgError={() => {}} />
            </div>
          )}
          <div
            className={`flex items-center gap-12 cursor-pointer group ${animating ? (direction === "left" ? "enter-from-right" : "enter-from-left") : ""}`}
            onClick={() => goTo(`/${citySlug}/${active.slug}`)}
          >
            <DesktopCard ev={active} citySlug={citySlug} goTo={goTo} imgError={imgError} setImgError={setImgError} />
          </div>
        </div>
        {hasMultiple && (
          <div className="flex justify-center gap-2 mt-4">
            {allEvents.map((_, i) => (
              <button
                key={i}
                onClick={() => slideTo(i, i > current ? "left" : "right")}
                className={`rounded-full transition-all duration-200 ${i === current ? "w-6 h-2.5 bg-indigo-600" : "w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* MOBILE */}
      <div className="block sm:hidden">
        <div ref={scrollRef} className="overflow-x-auto scrollbar-hide snap-x snap-mandatory flex gap-3 px-6">
          {allEvents.map((ev, i) => (
            <div
              key={ev.slug ?? i}
              className="shrink-0 snap-center cursor-pointer"
              style={{ width: "calc(100vw - 48px)" }}
              onClick={() => goTo(`/${citySlug}/${ev.slug}`)}
            >
              <div className="relative w-full rounded-2xl overflow-hidden shadow-md" style={{ aspectRatio: "16/9" }}>
                {ev.image ? (
                  <Image
                    src={ev.image}
                    alt={ev.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-amber-50 flex items-center justify-center">
                    <Calendar className="w-10 h-10 text-indigo-300" />
                  </div>
                )}
                <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-amber-50/95 text-amber-600 border border-amber-200 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ fontFamily: "'Sora', sans-serif" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" /> Editor's pick
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleBookmarkToggle(); }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center"
                >
                  <Bookmark className={`w-4 h-4 ${isSaved ? "fill-indigo-600 text-indigo-600" : "text-gray-400"}`} />
                </button>
              </div>
              <div className="pt-3 space-y-1">
                <h3 className="text-base font-bold text-gray-900 leading-snug text-center" style={{ fontFamily: "'Sora', sans-serif" }}>{ev.title}</h3>
                <p className="text-gray-400 text-sm text-center" style={{ fontFamily: "'Sora', sans-serif" }}>{ev.date} • {ev.time}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between px-6 mt-3">
          <div className="flex gap-1.5">
            {allEvents.map((_, i) => (
              <button key={i} onClick={() => scrollToCard(i)} className={`rounded-full transition-all duration-200 ${i === current ? "w-5 h-2 bg-indigo-600" : "w-2 h-2 bg-gray-300"}`} />
            ))}
          </div>
          <span className="text-xs text-gray-400" style={{ fontFamily: "'Sora', sans-serif" }}>Featured</span>
        </div>
      </div>
    </section>
  );
}

function DesktopCard({ ev, citySlug, goTo, imgError, setImgError }: {
  ev: Event; citySlug: string;
  goTo: (url: string) => void;
  imgError: boolean; setImgError: (v: boolean) => void;
}) {
  const { isSaved, handleBookmarkToggle } = useBookmark(ev);
  return (
    <>
      <div className="w-[520px] shrink-0 rounded-2xl overflow-hidden shadow-md relative" style={{ height: 270 }}>
        {!imgError && ev.image ? (
          <Image
            src={ev.image}
            alt={ev.title}
            fill
            sizes="520px"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-amber-50 flex items-center justify-center">
            <Calendar className="w-12 h-12 text-indigo-300" />
          </div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); handleBookmarkToggle(); }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition"
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? "fill-indigo-600 text-indigo-600" : "text-gray-400"}`} />
        </button>
      </div>
      <div className="flex-1 flex flex-col min-w-0" style={{ height: 270 }}>
        <div className="flex flex-col gap-3">
          <span className="inline-flex items-center gap-1.5 self-start bg-amber-50 text-amber-600 border border-amber-200 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ fontFamily: "'Sora', sans-serif" }}>
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Editor's pick
          </span>
          <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-snug group-hover:text-indigo-800 transition-colors" style={{ fontFamily: "'Sora', sans-serif" }}>{ev.title}</h3>
          <p className="text-gray-400 text-base" style={{ fontFamily: "'Sora', sans-serif" }}>{ev.date} • {ev.time}</p>
        </div>
        <div className="flex-1 min-h-[40px]" />
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={(e) => { e.stopPropagation(); toast.info("Ticket booking coming soon!"); }}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold px-5 py-2.5 transition-colors"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            <Ticket className="w-4 h-4" /> Book Tickets
          </button>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {["bg-pink-400", "bg-violet-500", "bg-amber-400"].map((c, i) => (
                <div key={i} className={`w-7 h-7 rounded-full ${c} border-2 border-white`} />
              ))}
            </div>
            <span className="text-sm text-gray-600" style={{ fontFamily: "'Sora', sans-serif" }}>
              <span className="font-semibold">{ev.interested}</span> Interested
            </span>
          </div>
          <span className="ml-auto text-xs text-gray-400" style={{ fontFamily: "'Sora', sans-serif" }}>Featured</span>
        </div>
      </div>
    </>
  );
}
