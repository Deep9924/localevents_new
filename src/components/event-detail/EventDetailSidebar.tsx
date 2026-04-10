"use client";
import { Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SaveButton, ShareButton } from "./EventDetailShared";
import type { Tier } from "./types";

interface SidebarProps {
  isFree: boolean;
  displayPrice: string | null;
  tiers: Tier[];
  selectedTierId: number | undefined;
  onSelectTier: (id: number) => void;
  isSaved: boolean;
  onSave: () => void;
  eventTitle: string;
  user: any;
  onGetTickets: () => void;
}

export function EventDetailSidebar({
  isFree, displayPrice, tiers, selectedTierId, onSelectTier,
  isSaved, onSave, eventTitle, user, onGetTickets,
}: SidebarProps) {
  const selectedTier = tiers.find(t => t.id === selectedTierId);
  const selectedPrice = selectedTier ? Number(selectedTier.price) : null;

  return (
    <div className="space-y-4">
      {/* Price */}
      <div className="pb-4 border-b border-gray-100">
        <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium mb-1">
          Tickets from
        </p>
        <p className={`text-3xl font-bold ${isFree ? "text-green-600" : "text-gray-900"}`}>
          {selectedPrice !== null && selectedPrice > 0
            ? `CAD $${selectedPrice.toFixed(2)}`
            : displayPrice ?? "Free"}
        </p>
        {!isFree && (
          <p className="text-xs text-gray-400 mt-0.5">Per person · No hidden fees</p>
        )}
      </div>

      {/* Ticket tiers — only shown when tiers exist */}
      {tiers.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">
            Select ticket type
          </p>
          {tiers.map(tier => {
            const tierPrice = Number(tier.price);
            const isSelected = selectedTierId === tier.id;
            return (
              <button
                key={tier.id}
                onClick={() => onSelectTier(tier.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition-colors
                  ${isSelected
                    ? "border-indigo-600 bg-indigo-50 text-indigo-800"
                    : "border-gray-200 hover:border-indigo-200 hover:bg-gray-50 text-gray-700"
                  }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight truncate">{tier.name}</p>
                  {tier.description && (
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">{tier.description}</p>
                  )}
                </div>
                <p className={`text-sm font-bold shrink-0 ml-3 ${isSelected ? "text-indigo-700" : "text-gray-900"}`}>
                  {tierPrice === 0 ? "Free" : `$${tierPrice.toFixed(2)}`}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* Get Tickets CTA */}
      <Button
        onClick={onGetTickets}
        className="w-full h-12 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2"
      >
        <Ticket className="w-4 h-4" />
        {isFree ? "Register Free" : "Get Tickets"}
      </Button>

      {/* Save + Share */}
      <div className="flex gap-2">
        <SaveButton isSaved={isSaved} onSave={onSave} variant="full" className="flex-1" />
        <ShareButton eventTitle={eventTitle} variant="icon-only" />
      </div>

      <p className="text-center text-[11px] text-gray-300">
        Secure checkout · LocalEvents
      </p>
    </div>
  );
}