"use client";

import { useState } from "react";
import { Heart, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const TESTIMONIALS = [
  { name: "Sarah M.", city: "Toronto", text: "Found the best jazz concert through LocalEvents!", avatar: "S" },
  { name: "James K.", city: "Vancouver", text: "Never miss a local festival anymore. Love this app!", avatar: "J" },
  { name: "Priya R.", city: "Calgary", text: "Discovered so many hidden gems in my city.", avatar: "P" },
];

export default function CommunityBanner() {
  const [joined, setJoined] = useState(false);

  return (
    <section className="py-12 bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-2xl overflow-hidden relative my-8">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 left-8 w-32 h-32 bg-amber-400 rounded-full blur-3xl" />
        <div className="absolute bottom-4 right-8 w-40 h-40 bg-indigo-400 rounded-full blur-3xl" />
      </div>

      <div className="relative px-6 sm:px-10">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Left: CTA */}
          <div className="flex-1 text-center lg:text-left">
            <div className="flex items-center gap-2 justify-center lg:justify-start mb-3">
              <Heart className="w-5 h-5 text-amber-400" />
              <span className="text-amber-400 font-semibold text-sm uppercase tracking-wide">
                Loved by millions
              </span>
            </div>
            <h2
              className="text-2xl sm:text-3xl font-bold text-white mb-2"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              Lived on LocalEvents
            </h2>
            <p className="text-indigo-200 text-sm mb-6 max-w-md">
              Join the people turning moments into memories. Get personalized event
              recommendations delivered to your inbox.
            </p>

            {/* Stats */}
            <div className="flex items-center gap-6 justify-center lg:justify-start mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">2M+</div>
                <div className="text-indigo-300 text-xs">Members</div>
              </div>
              <div className="w-px h-8 bg-indigo-600" />
              <div className="text-center">
                <div className="text-2xl font-bold text-white">50K+</div>
                <div className="text-indigo-300 text-xs">Events/month</div>
              </div>
              <div className="w-px h-8 bg-indigo-600" />
              <div className="text-center">
                <div className="text-2xl font-bold text-white">200+</div>
                <div className="text-indigo-300 text-xs">Cities</div>
              </div>
            </div>

            <Button
              onClick={() => {
                setJoined(true);
                toast.success("Welcome to the LocalEvents community!");
              }}
              disabled={joined}
              className="bg-amber-500 hover:bg-amber-400 text-white font-semibold px-8 shadow-lg border-0"
            >
              <Users className="w-4 h-4 mr-2" />
              {joined ? "You're in!" : "Join the community"}
            </Button>
          </div>

          {/* Right: Testimonials */}
          <div className="flex-1 flex flex-col gap-3 w-full max-w-sm">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-semibold text-sm">{t.name}</span>
                      <span className="text-indigo-300 text-xs">{t.city}</span>
                    </div>
                    <p className="text-indigo-100 text-sm">{t.text}</p>
                    <div className="flex mt-1">
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
    </section>
  );
}
