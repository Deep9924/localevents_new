"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  Loader2, X, Minus, Plus, Check,
  ChevronRight, ChevronLeft, User,
  Ticket, CreditCard, Info,
} from "lucide-react";
import { toast } from "sonner";

interface TicketCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  price: string | null;
  onSuccess?: () => void;
  user?: { name?: string | null; email?: string | null } | null;
}

const PROVINCE_CODES = [
  { code: "AB", name: "Alberta" },
  { code: "BC", name: "British Columbia" },
  { code: "MB", name: "Manitoba" },
  { code: "NB", name: "New Brunswick" },
  { code: "NL", name: "Newfoundland and Labrador" },
  { code: "NS", name: "Nova Scotia" },
  { code: "ON", name: "Ontario" },
  { code: "PE", name: "Prince Edward Island" },
  { code: "QC", name: "Quebec" },
  { code: "SK", name: "Saskatchewan" },
  { code: "NT", name: "Northwest Territories" },
  { code: "NU", name: "Nunavut" },
  { code: "YT", name: "Yukon" },
] as const;

const DOMESTIC_FEE_PERCENT = 0.05;
const FIXED_FEE_CAD = 1.5;

export default function TicketCheckoutModal({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  price,
  onSuccess,
  user,
}: TicketCheckoutModalProps) {
  const [step, setStep] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [selectedTierId, setSelectedTierId] = useState<number | null>(null);
  const [userDetails, setUserDetails] = useState({
    firstName: user?.name?.split(" ")[0] ?? "",
    lastName: user?.name?.split(" ").slice(1).join(" ") ?? "",
    email: user?.email ?? "",
    province: "ON",
  });

  const createCheckoutMutation = trpc.tickets.createCheckoutSession.useMutation();

  const { data: tiers = [], isLoading: tiersLoading } =
    trpc.ticketTiers.getByEvent.useQuery({ eventId }, { enabled: isOpen });

  const { data: taxRateData } = trpc.tickets.getTaxRateByProvince.useQuery(
    { provinceCode: userDetails.province as any },
    { enabled: isOpen && !!userDetails.province }
  );

  const hasMultipleTiers = tiers.length > 0;
  const isFree = price === "Free" || price === null;

  const selectedTier = useMemo(
    () => (selectedTierId ? tiers.find((t) => t.id === selectedTierId) : null),
    [selectedTierId, tiers]
  );

  const unitPrice = useMemo(() => {
    if (selectedTier) return Number(selectedTier.price);
    if (isFree) return 0;
    return parseFloat(price?.replace(/[^d.]/g, "") ?? "0") || 0;
  }, [selectedTier, isFree, price]);

  const subtotal = unitPrice * quantity;

  const gstRate = Number(taxRateData?.gstRate ?? 0);
  const pstRate = Number(taxRateData?.pstRate ?? 0);
  const hstRate = Number(taxRateData?.hstRate ?? 0);

  const gst = Math.round(subtotal * gstRate * 100) / 100;
  const pst = Math.round(subtotal * pstRate * 100) / 100;
  const hst = Math.round(subtotal * hstRate * 100) / 100;
  const totalTax = gst + pst + hst;

  const processingFee =
    subtotal > 0
      ? Math.round((subtotal * DOMESTIC_FEE_PERCENT + FIXED_FEE_CAD) * 100) / 100
      : 0;

  const total = subtotal + totalTax + processingFee;

  useEffect(() => {
    if (hasMultipleTiers && tiers.length > 0 && !selectedTierId) {
      setSelectedTierId(tiers[0].id);
    }
  }, [hasMultipleTiers, tiers, selectedTierId]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setQuantity(1);
      setSelectedTierId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 1 && hasMultipleTiers && !selectedTierId) {
      toast.error("Please select a ticket tier");
      return;
    }
    if (step === 2) {
      if (
        !userDetails.firstName.trim() ||
        !userDetails.lastName.trim() ||
        !userDetails.email.trim() ||
        !userDetails.province
      ) {
        toast.error("Please fill in all details");
        return;
      }
      const emailRegex = /^[^s@]+@[^s@]+.[^s@]+$/;
      if (!emailRegex.test(userDetails.email)) {
        toast.error("Please enter a valid email address");
        return;
      }
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => s - 1);

  const handleCheckout = async () => {
    try {
      toast.info("Redirecting to secure checkout...");
      const result = await createCheckoutMutation.mutateAsync({
        eventId,
        lineItems: [
          {
            tierId: hasMultipleTiers ? selectedTierId : null,
            quantity,
          },
        ],
        billingProvince: userDetails.province as any,
        firstName: userDetails.firstName.trim(),
        lastName: userDetails.lastName.trim(),
        email: userDetails.email.trim(),
        confirmEmail: userDetails.email.trim(),
        country: "CA",
      });

      if (result.free) {
        toast.success("Tickets acquired successfully!");
        onClose();
        onSuccess?.();
      } else if (result.url) {
        window.location.href = result.url;
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to process checkout. Please try again.";
      toast.error(msg);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in slide-in-from-bottom-4 duration-300 max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">Checkout</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-between relative px-2">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
            <div
              className="absolute top-1/2 left-0 h-0.5 bg-indigo-600 -translate-y-1/2 z-0 transition-all duration-300"
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            />
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  step >= s
                    ? "bg-indigo-600 text-white"
                    : "bg-white border-2 border-slate-200 text-slate-400"
                }`}
              >
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* Step 1 — Select Tickets */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-indigo-600 font-semibold">
                <Ticket className="w-5 h-5" />
                <span>Select Tickets</span>
              </div>

              {tiersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                </div>
              ) : hasMultipleTiers ? (
                <div className="space-y-3">
                  {tiers.map((tier) => {
                    const isSelected = selectedTierId === tier.id;
                    const soldOut =
                      !!tier.quantity &&
                      Number(tier.sold ?? 0) >= Number(tier.quantity);
                    return (
                      <button
                        key={tier.id}
                        onClick={() => !soldOut && setSelectedTierId(tier.id)}
                        disabled={soldOut}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50 shadow-sm"
                            : "border-slate-100 hover:border-slate-200"
                        } ${soldOut ? "opacity-50 grayscale cursor-not-allowed" : ""}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-slate-900">{tier.name}</p>
                            {tier.description && (
                              <p className="text-xs text-slate-500 mt-1">{tier.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-indigo-600">
                              CAD ${Number(tier.price).toFixed(2)}
                            </p>
                            {soldOut && (
                              <p className="text-[10px] text-red-500 font-bold uppercase">
                                Sold Out
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-sm font-medium text-slate-900">{eventTitle}</p>
                  <p className="text-lg font-bold text-indigo-600 mt-1">
                    {isFree ? "Free" : price}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <Label className="text-xs font-bold text-slate-500 uppercase">
                  Quantity
                </Label>
                <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-1 w-fit border border-slate-100">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity === 1}
                    className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all disabled:opacity-30"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-lg font-bold w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                    disabled={quantity === 10}
                    className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all disabled:opacity-30"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Your Details */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-indigo-600 font-semibold">
                <User className="w-5 h-5" />
                <span>Your Details</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={userDetails.firstName}
                    onChange={(e) =>
                      setUserDetails((d) => ({ ...d, firstName: e.target.value }))
                    }
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={userDetails.lastName}
                    onChange={(e) =>
                      setUserDetails((d) => ({ ...d, lastName: e.target.value }))
                    }
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={userDetails.email}
                  onChange={(e) =>
                    setUserDetails((d) => ({ ...d, email: e.target.value }))
                  }
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="province">Province for Tax Calculation</Label>
                <Select
                  value={userDetails.province}
                  onValueChange={(v) =>
                    setUserDetails((d) => ({ ...d, province: v }))
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVINCE_CODES.map((p) => (
                      <SelectItem key={p.code} value={p.code}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                  <Info className="w-3 h-3" /> Taxes are based on your selected province.
                </p>
              </div>
            </div>
          )}

          {/* Step 3 — Order Summary */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-indigo-600 font-semibold">
                <CreditCard className="w-5 h-5" />
                <span>Order Summary</span>
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 space-y-4 border border-slate-100">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">
                    {quantity} × {selectedTier?.name ?? "Standard Ticket"}
                  </span>
                  <span className="font-bold text-slate-900">
                    CAD ${subtotal.toFixed(2)}
                  </span>
                </div>

                {subtotal > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    {gst > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">
                          GST ({(gstRate * 100).toFixed(0)}%)
                        </span>
                        <span className="font-medium text-slate-900">
                          CAD ${gst.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {pst > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">
                          PST ({(pstRate * 100).toFixed(1)}%)
                        </span>
                        <span className="font-medium text-slate-900">
                          CAD ${pst.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {hst > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">
                          HST ({(hstRate * 100).toFixed(0)}%)
                        </span>
                        <span className="font-medium text-slate-900">
                          CAD ${hst.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">
                        Processing Fee (5% + $1.50)
                      </span>
                      <span className="font-medium text-slate-900">
                        CAD ${processingFee.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-slate-900">Total</span>
                  <span className="text-2xl font-black text-indigo-600">
                    CAD ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  You will be redirected to Stripe's secure checkout to complete your
                  payment. Tickets will be sent to{" "}
                  <strong>{userDetails.email}</strong>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
          {step > 1 ? (
            <Button variant="outline" onClick={handleBack} className="flex-1 rounded-xl">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          ) : (
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">
              Cancel
            </Button>
          )}

          {step < 3 ? (
            <Button
              onClick={handleNext}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleCheckout}
              disabled={createCheckoutMutation.isPending}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
            >
              {createCheckoutMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : unitPrice === 0 ? (
                "Get Tickets"
              ) : (
                "Pay Now"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
