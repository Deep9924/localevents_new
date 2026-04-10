"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, X, Minus, Plus, Check } from "lucide-react";
import { toast } from "sonner";

interface TicketCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  price: string | null;
  tierId?: number;
  quantity?: number;
  onSuccess?: () => void;
}

export default function TicketCheckoutModal({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  price,
  tierId: initialTierId,
  quantity: initialQuantity = 1,
  onSuccess,
}: TicketCheckoutModalProps) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [selectedTierId, setSelectedTierId] = useState<number | null>(initialTierId ?? null);

  const createCheckoutMutation = trpc.tickets.createCheckoutSession.useMutation();

  const { data: tiers = [], isLoading: tiersLoading } = trpc.ticketTiers.getByEvent.useQuery(
    { eventId },
    { enabled: isOpen }
  );

  const isFree = price === "Free" || price === null;

  useEffect(() => {
    if (initialTierId) setSelectedTierId(initialTierId);
  }, [initialTierId]);

  useEffect(() => {
    if (tiers.length > 0 && !selectedTierId) {
      setSelectedTierId(tiers[0].id);
    }
  }, [tiers, selectedTierId]);

  useEffect(() => {
    if (isOpen) setQuantity(initialQuantity);
  }, [isOpen, initialQuantity]);

  if (!isOpen) return null;

  const selectedTier = selectedTierId ? tiers.find((t) => t.id === selectedTierId) : null;

  // Drizzle returns decimal columns as strings — always coerce with Number()
  const displayUnitPrice = selectedTier
    ? Number(selectedTier.price)
    : isFree
    ? 0
    : parseFloat(price?.replace(/[^\d.]/g, "") || "0");

  const displaySubtotal = displayUnitPrice * quantity;
  const displayTax = displaySubtotal * 0.13;
  const displayServiceFee = displaySubtotal * 0.03;
  const displayTotal = displaySubtotal + displayTax + displayServiceFee;

  const handleCheckout = async () => {
    const tierIdToUse = selectedTierId ?? (tiers.length > 0 ? tiers[0].id : undefined);

    if (tiers.length > 0 && !tierIdToUse) {
      toast.error("Please select a ticket type.");
      return;
    }

    try {
      toast.info("Processing your order...");

      const result = await createCheckoutMutation.mutateAsync({
        eventId,
        quantity,
        tierId: tierIdToUse,
      });

      if (result.free) {
        toast.success("Tickets acquired successfully!");
        onClose();
        onSuccess?.();
      } else if (result.url) {
        window.location.href = result.url;
      } else {
        toast.error("No checkout URL returned. Please try again.");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      const msg = error?.message ?? "";
      if (msg.includes("UNAUTHORIZED") || msg.includes("unauthorized")) {
        toast.error("Please sign in to purchase tickets.");
      } else {
        toast.error(msg || "Failed to process checkout. Please try again.");
      }
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[92dvh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Get Tickets</h2>
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{eventTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Tier selector */}
          {tiersLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : tiers.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">
                Ticket type
              </p>
              {tiers.map((tier) => {
                const tierPrice = Number(tier.price); // coerce string → number
                const isSelected = selectedTierId === tier.id;
                const available = !tier.quantity || (Number(tier.sold ?? 0) < Number(tier.quantity));
                return (
                  <button
                    key={tier.id}
                    onClick={() => available && setSelectedTierId(tier.id)}
                    disabled={!available}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl border text-left transition-colors
                      ${isSelected
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-gray-200 hover:border-indigo-200 hover:bg-gray-50"
                      } ${!available ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{tier.name}</p>
                      {tier.description && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{tier.description}</p>
                      )}
                      {!available && (
                        <p className="text-xs text-red-500 font-medium mt-0.5">Sold out</p>
                      )}
                    </div>
                    <p className={`text-sm font-bold shrink-0 ml-3 ${isSelected ? "text-indigo-700" : "text-gray-900"}`}>
                      {tierPrice === 0 ? "Free" : `CAD $${tierPrice.toFixed(2)}`}
                    </p>
                  </button>
                );
              })}
            </div>
          ) : null}

          {/* Quantity */}
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium mb-3">
              Number of tickets
            </p>
            <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-1 w-fit">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity === 1}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Minus className="w-4 h-4 text-gray-600" />
              </button>
              <span className="text-lg font-bold text-gray-900 w-6 text-center tabular-nums">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => Math.min(100, q + 1))}
                disabled={quantity === 100}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Price breakdown */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
            <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">
              Price breakdown
            </p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">
                {displayUnitPrice === 0 ? "Free" : `CAD $${displayUnitPrice.toFixed(2)}`} × {quantity} {quantity === 1 ? "ticket" : "tickets"}
              </span>
              <span className="font-medium text-gray-900">
                {displayUnitPrice === 0 ? "Free" : `CAD $${displaySubtotal.toFixed(2)}`}
              </span>
            </div>
            {displayUnitPrice > 0 && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">HST (13%)</span>
                  <span className="font-medium text-gray-900">CAD ${displayTax.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Service fee (3%)</span>
                  <span className="font-medium text-gray-900">CAD ${displayServiceFee.toFixed(2)}</span>
                </div>
              </>
            )}
            <div className="border-t border-gray-200 pt-2.5 flex items-center justify-between">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="text-lg font-bold text-indigo-600">
                {displayUnitPrice === 0 ? "Free" : `CAD $${displayTotal.toFixed(2)}`}
              </span>
            </div>
            <p className="text-[11px] text-gray-300 pt-1 border-t border-gray-100">
              Final amounts confirmed securely on the server
            </p>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            By proceeding, you agree to our terms and conditions. Tickets are non-refundable unless the event is cancelled.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 h-11 rounded-xl font-semibold"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCheckout}
            disabled={createCheckoutMutation.isPending || tiersLoading}
            className="flex-1 h-11 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold"
          >
            {createCheckoutMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing…</>
            ) : (
              <><Check className="w-4 h-4 mr-2" />{displayUnitPrice === 0 ? "Register Free" : "Pay Now"}</>
            )}
          </Button>
        </div>

      </div>
    </div>
  );
}