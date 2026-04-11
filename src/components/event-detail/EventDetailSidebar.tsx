
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
        <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium mb-0.5">
          Tickets from
        </p>
        <p className={`text-3xl font-bold ${isFree ? "text-green-600" : "text-gray-900"}`}>
          {selectedPrice !== null && selectedPrice > 0
            ? `CAD $${selectedPrice.toFixed(2)}`
            : displayPrice ?? "Free"}
        </p>
      </div>

      {/* Ticket tiers */}
      {tiers.length > 0 && (
        <div>
          <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium mb-3">
            Ticket types
          </p>
          <div className="divide-y divide-gray-50">
            {tiers.map(tier => {
              const tierPrice = Number(tier.price);
              return (
                <div key={tier.id} className="flex items-start justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 leading-snug">
                      {tier.name}
                    </p>
                    {tier.description && (
                      <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                        {tier.description}
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-bold text-gray-900 shrink-0 pt-px">
                    {tierPrice === 0 ? "Free" : `$${tierPrice.toFixed(2)}`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Divider before CTA */}
      {tiers.length > 0 && <div className="border-t border-gray-100" />}

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
