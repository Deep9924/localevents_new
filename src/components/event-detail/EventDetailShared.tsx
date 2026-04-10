"use client";
import { useEffect, useRef, useState } from "react";
import {
  Share2, Twitter, Facebook, MessageCircle,
  Link2, Users, Bookmark,
} from "lucide-react";

export function HighlightRow({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-indigo-500" />
      </div>
      <p className="text-sm text-gray-800 leading-tight">{label}</p>
    </div>
  );
}

// Always flex-1 — parent row controls sizing
export function InterestedButton({
  isInterested,
  onToggle,
  className = "",
}: {
  isInterested: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center justify-center gap-2 h-10 px-4 rounded-xl border font-semibold text-sm transition-colors select-none
        ${isInterested
          ? "bg-indigo-700 border-indigo-700 text-white"
          : "border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50"
        } ${className}`}
    >
      <Users className="w-4 h-4 shrink-0" />
      {isInterested ? "Interested ✓" : "I'm Interested"}
    </button>
  );
}

export function SaveButton({
  isSaved,
  onSave,
  variant = "full",
  className = "",
}: {
  isSaved: boolean;
  onSave: () => void;
  variant?: "full" | "icon-only";
  className?: string;
}) {
  if (variant === "icon-only") {
    return (
      <button
        onClick={onSave}
        className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors shrink-0
          ${isSaved
            ? "bg-indigo-50 border-indigo-200 text-indigo-600"
            : "border-gray-200 text-gray-500 hover:bg-gray-50"
          } ${className}`}
        aria-label={isSaved ? "Unsave event" : "Save event"}
      >
        <Bookmark className={`w-4 h-4 ${isSaved ? "fill-indigo-600 text-indigo-600" : ""}`} />
      </button>
    );
  }

  return (
    <button
      onClick={onSave}
      className={`flex items-center justify-center gap-2 h-10 rounded-xl border font-semibold text-sm transition-colors
        ${isSaved
          ? "bg-indigo-50 border-indigo-200 text-indigo-700"
          : "border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
        } ${className}`}
    >
      <Bookmark className={`w-4 h-4 ${isSaved ? "fill-indigo-600 text-indigo-600" : ""}`} />
      {isSaved ? "Saved" : "Save"}
    </button>
  );
}

// variant="full"  → fills flex-1 container (same width as InterestedButton in a flex row)
// variant="icon-only" → 36×36 square icon
// variant="default"   → auto-width with padding
export function ShareButton({
  eventTitle,
  variant = "default",
}: {
  eventTitle: string;
  variant?: "default" | "icon-only" | "full";
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const url = typeof window !== "undefined" ? window.location.href : "";
  const enc = encodeURIComponent(url);
  const encTitle = encodeURIComponent(eventTitle);

  const socials = [
    {
      label: "Twitter / X",
      icon: Twitter,
      bg: "hover:bg-black hover:text-white",
      href: `https://twitter.com/intent/tweet?url=${enc}&text=${encTitle}`,
    },
    {
      label: "Facebook",
      icon: Facebook,
      bg: "hover:bg-blue-600 hover:text-white",
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc}`,
    },
    {
      label: "WhatsApp",
      icon: MessageCircle,
      bg: "hover:bg-green-500 hover:text-white",
      href: `https://wa.me/?text=${encTitle}%20${enc}`,
    },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const isIconOnly = variant === "icon-only";
  const isFull = variant === "full";

  return (
    // wrapper is flex-1 when "full" so it matches InterestedButton width
    <div ref={ref} className={`relative ${isFull ? "flex-1" : ""}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Share"
        className={`flex items-center justify-center gap-1.5 rounded-xl border font-semibold text-sm transition-colors
          ${
            isIconOnly
              ? "w-9 h-9 border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 hover:bg-gray-50"
              : isFull
              ? "w-full h-10 border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800"
              : "h-10 px-4 border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800"
          } ${open ? "bg-gray-50 border-gray-300" : ""}`}
      >
        <Share2 className="w-4 h-4" />
        {!isIconOnly && "Share"}
      </button>

      {open && (
        <div className="absolute right-0 top-full pt-1.5 z-50">
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
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </a>
            ))}
            <button
              onClick={handleCopy}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm border-t border-gray-50 transition-colors
                ${copied ? "text-green-700 bg-green-50" : "text-gray-700 hover:bg-gray-50"}`}
            >
              <Link2 className="w-4 h-4 shrink-0" />
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}