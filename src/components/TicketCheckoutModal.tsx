"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Loader2, X, Minus, Plus, Check, ChevronRight, ChevronLeft, User, Ticket, CreditCard, Info } from "lucide-react";
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

const PROVINCES = [
  { code: "AB", name: "Alberta", gst: 0.05, pst: 0, hst: 0 },
  { code: "BC", name: "British Columbia", gst: 0.05, pst: 0.07, hst: 0 },
  { code: "MB", name: "Manitoba", gst: 0.05, pst: 0.07, hst: 0 },
  { code: "NB", name: "New Brunswick", gst: 0, pst: 0, hst: 0.15 },
  { code: "NL", name: "Newfoundland and Labrador", gst: 0, pst: 0, hst: 0.15 },
  { code: "NS", name: "Nova Scotia", gst: 0, pst: 0, hst: 0.15 },
  { code: "ON", name: "Ontario", gst: 0, pst: 0, hst: 0.13 },
  { code: "PE", name: "Prince Edward Island", gst: 0, pst: 0, hst: 0.15 },
  { code: "QC", name: "Quebec", gst: 0.05, pst: 0.09975, hst: 0 },
  { code: "SK", name: "Saskatchewan", gst: 0.05, pst: 0.06, hst: 0 },
  { code: "NT", name: "Northwest Territories", gst: 0.05, pst: 0, hst: 0 },
  { code: "NU", name: "Nunavut", gst: 0.05, pst: 0, hst: 0 },
  { code: "YT", name: "Yukon", gst: 0.05, pst: 0, hst: 0 },
];

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
    firstName: user?.name?.split(" ")[0] || "",
    lastName: user?.name?.split(" ").slice(1).join(" ") || "",
    email: user?.email || "",
    province: "ON",
  });

  const createCheckoutMutation = trpc.tickets.createCheckoutSession.useMutation();
  
  const { data: tiers = [], isLoading: tiersLoading } = trpc.ticketTiers.getByEvent.useQuery(
    { eventId },
    { enabled: isOpen }
  );

  const hasMultipleTiers = tiers.length > 0;
  const isFree = price === "Free" || price === null;

  const selectedTier = useMemo(() => 
    selectedTierId ? tiers.find(t => t.id === selectedTierId) : null
  , [selectedTierId, tiers]);

  const displayUnitPrice = useMemo(() => {
    if (selectedTier) return Number(selectedTier.price);
    if (isFree) return 0;
    return parseFloat(price?.replace(/[^\d.]/g, "") || "0");
  }, [selectedTier, isFree, price]);

  const provinceData = useMemo(() => 
    PROVINCES.find(p => p.code === userDetails.province) || PROVINCES[6]
  , [userDetails.province]);

  const displaySubtotal = displayUnitPrice * quantity;
  const taxRates = {
    gst: displaySubtotal * provinceData.gst,
    pst: displaySubtotal * provinceData.pst,
    hst: displaySubtotal * provinceData.hst,
  };
  const displayServiceFee = displaySubtotal * 0.03;
  const totalTax = taxRates.gst + taxRates.pst + taxRates.hst;
  const displayTotal = displaySubtotal + totalTax + displayServiceFee;

  useEffect(() => {
    if (hasMultipleTiers && tiers.length > 0 && !selectedTierId) {
      setSelectedTierId(tiers[0].id);
    }
  }, [hasMultipleTiers, tiers, selectedTierId]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 1 && hasMultipleTiers && !selectedTierId) {
      toast.error("Please select a ticket tier");
      return;
    }
    if (step === 2) {
      if (!userDetails.firstName || !userDetails.lastName || !userDetails.email || !userDetails.province) {
        toast.error("Please fill in all details");
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => setStep(step - 1);

  const handleCheckout = async () => {
    try {
      toast.info("Redirecting to secure checkout...");
      const result = await createCheckoutMutation.mutateAsync({
        eventId,
        lineItems: hasMultipleTiers 
          ? [{ tierId: selectedTierId, quantity }]
          : [{ tierId: null, quantity }],
        billingProvince: userDetails.province as any,
        firstName: userDetails.firstName,
        lastName: userDetails.lastName,
        email: userDetails.email,
        confirmEmail: userDetails.email,
        country: "CA",
      });

      if (result.free) {
        toast.success("Tickets acquired successfully!");
        onClose();
        onSuccess?.();
      } else if (result.url) {
        window.location.href = result.url;
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(error.message || "Failed to process checkout. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in slide-in-from-bottom-4 duration-300 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">Checkout</h2>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between relative px-2">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
            <div className="absolute top-1/2 left-0 h-0.5 bg-indigo-600 -translate-y-1/2 z-0 transition-all duration-300" 
                 style={{ width: `${((step - 1) / 2) * 100}%` }} />
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                  ${step >= s ? "bg-indigo-600 text-white" : "bg-white border-2 border-slate-200 text-slate-400"}`}
              >
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-indigo-600 font-semibold">
                <Ticket className="w-5 h-5" />
                <span>Select Tickets</span>
              </div>
              
              {hasMultipleTiers ? (
                <div className="space-y-3">
                  {tiers.map((tier) => {
                    const isSelected = selectedTierId === tier.id;
                    const available = !tier.quantity || (Number(tier.sold) ?? 0) < Number(tier.quantity);
                    return (
                      <button
                        key={tier.id}
                        onClick={() => available && setSelectedTierId(tier.id)}
                        disabled={!available}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                          isSelected ? "border-indigo-600 bg-indigo-50 shadow-sm" : "border-slate-100 hover:border-slate-200"
                        } ${!available ? "opacity-50 grayscale" : ""}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-slate-900">{tier.name}</p>
                            {tier.description && <p className="text-xs text-slate-500 mt-1">{tier.description}</p>}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-indigo-600">CAD ${Number(tier.price).toFixed(2)}</p>
                            {!available && <p className="text-[10px] text-red-500 font-bold uppercase">Sold Out</p>}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-sm font-medium text-slate-900">{eventTitle}</p>
                  <p className="text-lg font-bold text-indigo-600 mt-1">{isFree ? "Free" : price}</p>
                </div>
              )}

              <div className="space-y-3">
                <Label className="text-xs font-bold text-slate-500 uppercase">Quantity</Label>
                <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-1 w-fit border border-slate-100">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity === 1}
                          className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all disabled:opacity-30">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-lg font-bold w-8 text-center">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(10, quantity + 1))} disabled={quantity === 10}
                          className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all disabled:opacity-30">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-indigo-600 font-semibold">
                <User className="w-5 h-5" />
                <span>Your Details</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" value={userDetails.firstName} onChange={(e) => setUserDetails({...userDetails, firstName: e.target.value})} placeholder="John" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={userDetails.lastName} onChange={(e) => setUserDetails({...userDetails, lastName: e.target.value})} placeholder="Doe" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={userDetails.email} onChange={(e) => setUserDetails({...userDetails, email: e.target.value})} placeholder="john@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="province">Province for Tax Calculation</Label>
                <Select value={userDetails.province} onValueChange={(v) => setUserDetails({...userDetails, province: v})}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVINCES.map((p) => (
                      <SelectItem key={p.code} value={p.code}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                  <Info className="w-3 h-3" /> Taxes are based on your selected province.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-indigo-600 font-semibold">
                <CreditCard className="w-5 h-5" />
                <span>Order Summary</span>
              </div>
              
              <div className="bg-slate-50 rounded-2xl p-5 space-y-4 border border-slate-100">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Tickets ({quantity} × {selectedTier?.name || "Standard"})</span>
                  <span className="font-bold text-slate-900">CAD ${displaySubtotal.toFixed(2)}</span>
                </div>
                
                {displayUnitPrice > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    {taxRates.gst > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">GST ({(provinceData.gst * 100).toFixed(0)}%)</span>
                        <span className="font-medium text-slate-900">CAD ${taxRates.gst.toFixed(2)}</span>
                      </div>
                    )}
                    {taxRates.pst > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">PST ({(provinceData.pst * 100).toFixed(1)}%)</span>
                        <span className="font-medium text-slate-900">CAD ${taxRates.pst.toFixed(2)}</span>
                      </div>
                    )}
                    {taxRates.hst > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">HST ({(provinceData.hst * 100).toFixed(0)}%)</span>
                        <span className="font-medium text-slate-900">CAD ${taxRates.hst.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Service Fee (3%)</span>
                      <span className="font-medium text-slate-900">CAD ${displayServiceFee.toFixed(2)}</span>
                    </div>
                  </div>
                )}
                
                <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-slate-900">Total</span>
                  <span className="text-2xl font-black text-indigo-600">CAD ${displayTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  You will be redirected to Stripe's secure checkout to complete your payment. Tickets will be sent to <strong>{userDetails.email}</strong>.
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
            <Button onClick={handleNext} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl">
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
              ) : (
                <>{displayUnitPrice === 0 ? "Get Tickets" : "Pay Now"}</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
