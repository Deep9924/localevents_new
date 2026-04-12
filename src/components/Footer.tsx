"use client";

import { MapPin, Mail, Twitter, Facebook, Instagram, Sparkles, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

const FOOTER_LINKS = {
  Discover: ["All Events", "Concerts", "Festivals", "Food & Drinks", "Art & Culture", "Sports"],
  Company: ["About Us", "Careers", "Press", "Blog", "Contact"],
  Support: ["Help Center", "Privacy Policy", "Terms of Service", "Cookie Policy"],
};

export default function Footer() {
  return (
    <footer className="bg-stone-950 text-stone-400 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-16 mb-20">
          {/* Brand & Mission */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shadow-xl shadow-amber-500/20">
                <Sparkles className="w-6 h-6 text-stone-950" />
              </div>
              <span className="font-bold text-white text-2xl tracking-tight font-sora">
                LocalEvents
              </span>
            </div>
            
            <p className="text-stone-500 text-lg leading-relaxed font-light">
              We're on a mission to bring people together through the magic of local experiences. Discover what makes your city alive.
            </p>

            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-amber-500" />
              </div>
              <div className="space-y-0.5">
                <div className="text-white text-sm font-bold">Global Presence</div>
                <div className="text-stone-500 text-xs">Available in 200+ cities worldwide</div>
              </div>
            </div>
          </div>

          {/* Links Sections */}
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section} className="space-y-6">
              <h4 className="font-bold text-white text-sm uppercase tracking-widest">{section}</h4>
              <ul className="space-y-4">
                {links.map((link) => (
                  <li key={link}>
                    <button
                      onClick={() => toast.info(`${link} — coming soon!`)}
                      className="group flex items-center text-stone-500 hover:text-amber-400 transition-all duration-300 text-sm font-medium"
                    >
                      {link}
                      <ArrowUpRight className="w-3 h-3 ml-1 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Social & Newsletter */}
          <div className="space-y-6">
            <h4 className="font-bold text-white text-sm uppercase tracking-widest">Connect</h4>
            <div className="flex gap-4">
              {[Twitter, Facebook, Instagram].map((Icon, i) => (
                <button
                  key={i}
                  onClick={() => toast.info("Social media links coming soon!")}
                  className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-amber-500 hover:text-stone-950 flex items-center justify-center transition-all duration-300 border border-white/5 hover:scale-110 active:scale-90"
                >
                  <Icon className="w-5 h-5" />
                </button>
              ))}
            </div>
            <div className="pt-4">
              <div className="text-white text-sm font-bold mb-2">Support</div>
              <div className="flex items-center gap-2 text-stone-500 hover:text-white transition-colors cursor-pointer group">
                <Mail className="w-4 h-4 group-hover:text-amber-400" />
                <span className="text-sm">hello@localevents.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <p className="text-xs text-stone-600 font-medium">
              © 2026 LocalEvents. All rights reserved.
            </p>
            <div className="flex gap-4">
              <span className="text-xs text-stone-600 hover:text-stone-400 cursor-pointer transition-colors">Privacy</span>
              <span className="text-xs text-stone-600 hover:text-stone-400 cursor-pointer transition-colors">Terms</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">System Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
