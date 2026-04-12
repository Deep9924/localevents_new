"use client";

import { useState } from "react";
import { Heart, Users, Star, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TESTIMONIALS = [
  { name: "Sarah M.", city: "Toronto", text: "Found the best jazz concert through LocalEvents!", avatar: "S" },
  { name: "James K.", city: "Vancouver", text: "Never miss a local festival anymore. Love this app!", avatar: "J" },
  { name: "Priya R.", city: "Calgary", text: "Discovered so many hidden gems in my city.", avatar: "P" },
];

export default function CommunityBanner() {
  const [joined, setJoined] = useState(false);

  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative overflow-hidden bg-stone-900 rounded-[3rem] shadow-2xl shadow-stone-200/50">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-stone-500 rounded-full blur-[120px]" />
          </div>

          <div className="relative px-8 py-12 sm:px-16 sm:py-20">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left: CTA */}
              <div className="space-y-8 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-bold uppercase tracking-widest">
                  <Sparkles className="w-4 h-4" />
                  Loved by millions
                </div>
                
                <div className="space-y-4">
                  <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight font-sora">
                    Lived on <span className="text-amber-400 italic">LocalEvents</span>
                  </h2>
                  <p className="text-stone-400 text-lg sm:text-xl font-light leading-relaxed max-w-lg mx-auto lg:mx-0">
                    Join the people turning moments into memories. Get personalized event
                    recommendations delivered to your inbox.
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-8 py-8 border-y border-white/5">
                  <div className="space-y-1">
                    <div className="text-3xl font-bold text-white">2M+</div>
                    <div className="text-stone-500 text-xs font-bold uppercase tracking-wider">Members</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold text-white">50K+</div>
                    <div className="text-stone-500 text-xs font-bold uppercase tracking-wider">Events</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold text-white">200+</div>
                    <div className="text-stone-500 text-xs font-bold uppercase tracking-wider">Cities</div>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setJoined(true);
                    toast.success("Welcome to the LocalEvents community!");
                  }}
                  disabled={joined}
                  size="lg"
                  className="rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-10 py-7 text-lg shadow-xl shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
                >
                  <Users className="mr-2 h-6 w-6" />
                  {joined ? "You're in!" : "Join the community"}
                </Button>
              </div>

              {/* Right: Testimonials */}
              <div className="space-y-4 w-full max-w-md mx-auto lg:ml-auto">
                {TESTIMONIALS.map((t, i) => (
                  <div
                    key={t.name}
                    className={cn(
                      "bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 transition-all hover:bg-white/10 hover:translate-x-2 duration-300",
                      i === 1 ? "lg:translate-x-8" : ""
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-stone-950 font-bold text-lg shrink-0 shadow-lg shadow-amber-500/20">
                        {t.avatar}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-bold">{t.name}</span>
                          <span className="text-stone-500 text-xs font-bold uppercase tracking-wider">{t.city}</span>
                        </div>
                        <p className="text-stone-300 text-sm leading-relaxed italic">"{t.text}"</p>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className="w-3 h-3 text-amber-400 fill-amber-400" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
