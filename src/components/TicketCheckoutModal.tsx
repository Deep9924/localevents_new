"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, X, Minus, Plus } from "lucide-react";
import { toast } from "sonner";

interface TicketCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  price: string | null;
  onSuccess?: () => void;
}

export default function TicketCheckoutModal({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  price,
  onSuccess,
}: TicketCheckoutModalProps) {
  const [quantity, setQuantity] = useState(1);
  const createCheckoutMutation = trpc.tickets.createCheckoutSession.useMutation();

  if (!isOpen) return null;

  const isFree = price === "Free" || price === null;
  const priceNumber = isFree ? 0 : parseFloat(price?.replace(/[^\d.]/g, "") || "0");
  const priceInCents = Math.round(priceNumber * 100);
  const totalPrice = (priceNumber * quantity).toFixed(2);

  const handleCheckout = async () => {
    try {
      toast.info("Processing your order...");
      const result = await createCheckoutMutation.mutateAsync({
        eventId,
        eventTitle,
        quantity,
        priceInCents,
        currency: "CAD",
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
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Get Tickets</h2>
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
            <p className="text-sm text-slate-600 mb-1">Event</p>
            <p className="font-semibold text-slate-900 line-clamp-2">{eventTitle}</p>
          </div>

          {/* Price Display */}
          {!isFree && (
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-1">Price per ticket</p>
              <p className="text-2xl font-bold text-slate-900">CAD ${priceNumber.toFixed(2)}</p>
            </div>
          )}

          {/* Quantity Selector */}
          <div>
            <p className="text-sm text-slate-600 mb-3">Number of Tickets</p>
            <div className="flex items-center gap-4 bg-slate-50 rounded-lg p-3 w-fit">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity === 1}
                className="p-1 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Minus className="w-4 h-4 text-slate-600" />
              </button>
              <span className="text-lg font-semibold text-slate-900 w-8 text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(100, quantity + 1))}
                disabled={quantity === 100}
                className="p-1 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Total */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-600">Total</span>
              <span className="text-2xl font-bold text-slate-900">
                {isFree ? "Free" : `CAD $${totalPrice}`}
              </span>
            </div>

            {/* Terms */}
            <p className="text-xs text-slate-500 mb-4">
              By proceeding, you agree to our terms and conditions. Tickets are non-refundable.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCheckout}
            disabled={createCheckoutMutation.isPending}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
          >
            {createCheckoutMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `${isFree ? "Get" : "Pay"} Now`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
