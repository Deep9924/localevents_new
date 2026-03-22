// Design: Civic Warmth — Clean footer with links and branding
import { MapPin, Mail, Twitter, Facebook, Instagram } from "lucide-react";
import { toast } from "sonner";

const FOOTER_LINKS = {
  Discover: ["All Events", "Concerts", "Festivals", "Food & Drinks", "Art & Culture", "Sports"],
  Company: ["About Us", "Careers", "Press", "Blog", "Contact"],
  Support: ["Help Center", "Privacy Policy", "Terms of Service", "Cookie Policy"],
};

export default function Footer() {
  return (
    <footer className="bg-indigo-950 text-indigo-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">LE</span>
              </div>
              <span className="font-bold text-white text-lg" style={{ fontFamily: "'Sora', sans-serif" }}>
                LocalEvents
              </span>
            </div>
            <p className="text-sm text-indigo-300 mb-4 max-w-xs leading-relaxed">
              Discover the best events happening near you. From concerts to festivals,
              art shows to food fairs — your city is alive.
            </p>
            <div className="flex items-center gap-2 text-sm text-indigo-300 mb-4">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>Available in 200+ cities worldwide</span>
            </div>
            <div className="flex gap-3">
              {[Twitter, Facebook, Instagram].map((Icon, i) => (
                <button
                  key={i}
                  onClick={() => toast.info("Social media links coming soon!")}
                  className="w-8 h-8 rounded-full bg-indigo-800 hover:bg-amber-500 flex items-center justify-center transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 className="font-semibold text-white text-sm mb-4">{section}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <button
                      onClick={() => toast.info(`${link} — coming soon!`)}
                      className="text-sm text-indigo-300 hover:text-amber-400 transition-colors"
                    >
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-indigo-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-indigo-400">
            © 2026 LocalEvents. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-indigo-400">
            <Mail className="w-3.5 h-3.5" />
            <span>hello@localevents.com</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
