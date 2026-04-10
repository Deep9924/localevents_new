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
  onSuccess?: () => void;
}

interface TicketTier {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  quantity?: number | null;
  sold: number;
  isActive: number;
}

const TAX_RATE = 0.13; // HST 13%
const SERVICE_FEE_PERCENT = 0.03; // 3% service fee

export default function TicketCheckoutModal({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  price,
  onSuccess,
}: TicketCheckoutModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedTierId, setSelectedTierId] = useState<number | null>(null);
  const createCheckoutMutation = trpc.tickets.createCheckoutSession.useMutation();
  
  const { data: tiers = [], isLoading: tiersLoading } = trpc.ticketTiers.getByEvent.useQuery(
    { eventId },
    { enabled: isOpen }
  );

  // Determine if we have multiple tiers or single price
  const hasMultipleTiers = tiers.length > 0;
  const isFree = price === "Free" || price === null;

  // Get the selected tier or use the default price
  const selectedTier = selectedTierId 
    ? tiers.find(t => t.id === selectedTierId)
    : null;

  const unitPriceNumber = selectedTier 
    ? selectedTier.price
    : isFree 
      ? 0 
      : parseFloat(price?.replace(/[^\d.]/g, "") || "0");

  const unitPriceCents = Math.round(unitPriceNumber * 100);
  const subtotal = unitPriceNumber * quantity;
  const taxAmount = subtotal * TAX_RATE;
  const serviceFee = subtotal * SERVICE_FEE_PERCENT;
  const total = subtotal + taxAmount + serviceFee;

  useEffect(() => {
    if (hasMultipleTiers && tiers.length > 0 && !selectedTierId) {
      setSelectedTierId(tiers[0].id);
    }
  }, [hasMultipleTiers, tiers, selectedTierId]);

  if (!isOpen) return null;

  const handleCheckout = async () => {
    try {
      toast.info("Processing your order...");
      const result = await createCheckoutMutation.mutateAsync({
        eventId,
        eventTitle,
        tierId: selectedTierId || undefined,
        tierName: selectedTier?.name,
        quantity,
        unitPriceInCents: unitPriceCents,
        currency: "CAD",
        taxRate: TAX_RATE,
        serviceFeePercent: SERVICE_FEE_PERCENT,
      });

      if (result.free) {
        toast.success("Tickets acquired successfully!");
        onClose();
        onSuccess?.();
      } else if (result.url) {
        // Redirect to Stripe checkout
        window.location.href = result.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to process checkout. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-200 bg-white">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Get Tickets
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Event Title */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Event
            </p>
            <p className="font-semibold text-slate-900 line-clamp-2 text-sm">
              {eventTitle}
            </p>
          </div>

          {/* Ticket Tiers Selection */}
          {hasMultipleTiers && tiersLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : hasMultipleTiers ? (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Ticket Type
              </p>
              <div className="space-y-2">
                {tiers.map((tier) => {
                  const isSelected = selectedTierId === tier.id;
                  const available = !tier.quantity || (tier.sold ?? 0) < tier.quantity;
                  
                  return (
                    <button
                      key={tier.id}
                      onClick={() => available && setSelectedTierId(tier.id)}
                      disabled={!available}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      } ${!available ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900 text-sm">
                            {tier.name}
                          </p>
                          {tier.description && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              {tier.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-2">
                          <p className="font-bold text-slate-900 text-sm">
                            CAD ${tier.price.toFixed(2)}
                          </p>
                          {!available && (
                            <p className="text-xs text-red-600 font-medium">
                              Sold out
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Quantity Selector */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Number of Tickets
            </p>
            <div className="flex items-center gap-4 bg-slate-50 rounded-lg p-1 w-fit">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity === 1}
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Minus className="w-4 h-4 text-slate-600" />
              </button>
              <span className="text-lg font-bold text-slate-900 w-8 text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(100, quantity + 1))}
                disabled={quantity === 100}
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Price Breakdown
            </p>
            
            {/* Subtotal */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">
                {unitPriceNumber === 0 ? "Free" : `CAD $${unitPriceNumber.toFixed(2)}`} × {quantity} {quantity === 1 ? "ticket" : "tickets"}
              </span>
              <span className="font-medium text-slate-900">
                {unitPriceNumber === 0 ? "Free" : `CAD $${subtotal.toFixed(2)}`}
              </span>
            </div>

            {/* Tax */}
            {unitPriceNumber > 0 && TAX_RATE > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  HST (13%)
                </span>
                <span className="font-medium text-slate-900">
                  CAD ${taxAmount.toFixed(2)}
                </span>
              </div>
            )}

            {/* Service Fee */}
            {unitPriceNumber > 0 && SERVICE_FEE_PERCENT > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  Service Fee (3%)
                </span>
                <span className="font-medium text-slate-900">
                  CAD ${serviceFee.toFixed(2)}
                </span>
              </div>
            )}

            {/* Total */}
            <div className="border-t border-slate-200 pt-2.5 mt-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">Total</span>
                <span className="text-lg font-bold text-indigo-600">
                  {unitPriceNumber === 0 ? "Free" : `CAD $${total.toFixed(2)}`}
                </span>
              </div>
            </div>
          </div>

          {/* Terms */}
          <p className="text-xs text-slate-500 leading-relaxed">
            By proceeding, you agree to our terms and conditions. Tickets are non-refundable unless the event is cancelled.
          </p>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 p-6 border-t border-slate-200 bg-white flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCheckout}
            disabled={createCheckoutMutation.isPending || tiersLoading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
          >
            {createCheckoutMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                {unitPriceNumber === 0 ? "Get" : "Pay"} Now
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
