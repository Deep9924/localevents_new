"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Loader2,
  X,
  Minus,
  Plus,
  Check,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
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
  user?: { name?: string | null; email?: string | null } | null;
}

const COUNTRY_OPTIONS = [
  { code: "CA", label: "Canada" },
  { code: "US", label: "United States" },
] as const;

const PROVINCE_OPTIONS = [
  { code: "AB", label: "Alberta" },
  { code: "BC", label: "British Columbia" },
  { code: "MB", label: "Manitoba" },
  { code: "NB", label: "New Brunswick" },
  { code: "NL", label: "Newfoundland and Labrador" },
  { code: "NS", label: "Nova Scotia" },
  { code: "NT", label: "Northwest Territories" },
  { code: "NU", label: "Nunavut" },
  { code: "ON", label: "Ontario" },
  { code: "PE", label: "Prince Edward Island" },
  { code: "QC", label: "Quebec" },
  { code: "SK", label: "Saskatchewan" },
  { code: "YT", label: "Yukon" },
] as const;

type ProvinceCode = (typeof PROVINCE_OPTIONS)[number]["code"];
type CountryCode = (typeof COUNTRY_OPTIONS)[number]["code"];

function formatMoney(v: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(v);
}

function splitName(name?: string | null) {
  if (!name) return { firstName: "", lastName: "" };
  const p = name.trim().split(/\s+/);
  return { firstName: p[0] ?? "", lastName: p.slice(1).join(" ") };
}

const inputCls =
  "h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-100 bg-white text-gray-900";

const selectCls =
  "h-11 w-full rounded-xl border border-gray-200 pl-3 pr-9 text-sm outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-100 bg-white text-gray-900 appearance-none cursor-pointer";

function SelectField({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={selectCls}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
    </div>
  );
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
  user,
}: TicketCheckoutModalProps) {
  const defaultName = splitName(user?.name);

  const [tierQuantities, setTierQuantities] = useState<Record<number, number>>({});
  const [singleQuantity, setSingleQuantity] = useState(initialQuantity);

  const [firstName, setFirstName] = useState(defaultName.firstName);
  const [lastName, setLastName] = useState(defaultName.lastName);
  const [email, setEmail] = useState(user?.email ?? "");
  const [confirmEmail, setConfirmEmail] = useState(user?.email ?? "");
  const [country, setCountry] = useState<CountryCode>("CA");
  const [billingProvince, setBillingProvince] = useState<ProvinceCode>("SK");
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const createCheckoutMutation = trpc.tickets.createCheckoutSession.useMutation();

  const { data: tiers = [], isLoading: tiersLoading } =
    trpc.ticketTiers.getByEvent.useQuery(
      { eventId },
      { enabled: isOpen }
    );

  const { data: taxRates = [] } = trpc.tickets.getTaxRates.useQuery(undefined, {
    enabled: isOpen,
  });

  const isFree = price === "Free" || price === null;

  useEffect(() => {
    if (isOpen) {
      const initialTierState =
        initialTierId && initialQuantity > 0 ? { [initialTierId]: initialQuantity } : {};

      setTierQuantities(initialTierState);
      setSingleQuantity(initialQuantity);
      setFirstName(defaultName.firstName);
      setLastName(defaultName.lastName);
      setEmail(user?.email ?? "");
      setConfirmEmail(user?.email ?? "");
      setCountry("CA");
      setBillingProvince("SK");
      setSummaryExpanded(false);
      setShowCancelDialog(false);
    }
  }, [
    isOpen,
    initialTierId,
    initialQuantity,
    defaultName.firstName,
    defaultName.lastName,
    user?.email,
  ]);

  const selectedTaxRate = taxRates.find((r) => r.provinceCode === billingProvince);
  const gstRate = Number(selectedTaxRate?.gstRate ?? 0);
  const pstRate = Number(selectedTaxRate?.pstRate ?? 0);
  const hstRate = Number(selectedTaxRate?.hstRate ?? 0);
  const isInternational = country !== "CA";
  const processingPct = isInternational ? 0.06 : 0.05;

  const rawUnitPrice = isFree
    ? 0
    : parseFloat(price?.replace(/[^\d.]/g, "") || "0");

  const lineItems = useMemo(() => {
    if (tiers.length === 0) {
      return [
        {
          tierId: null as number | null,
          name: "Ticket",
          price: rawUnitPrice,
          quantity: singleQuantity,
        },
      ];
    }

    return tiers
      .map((t) => ({
        tierId: t.id,
        name: t.name,
        price: Number(t.price),
        quantity: tierQuantities[t.id] ?? 0,
        available:
          !t.quantity || Number(t.sold ?? 0) < Number(t.quantity),
        remaining:
          t.quantity == null ? null : Math.max(0, Number(t.quantity) - Number(t.sold ?? 0)),
      }))
      .filter((l) => l.quantity > 0);
  }, [tiers, tierQuantities, singleQuantity, rawUnitPrice]);

  const preview = useMemo(() => {
    const subtotal = lineItems.reduce((s, l) => s + l.price * l.quantity, 0);
    const processingFee =
      subtotal > 0 ? Math.round((subtotal * processingPct + 1.5) * 100) / 100 : 0;
    const gst = Math.round(subtotal * gstRate * 100) / 100;
    const pst = Math.round(subtotal * pstRate * 100) / 100;
    const hst = Math.round(subtotal * hstRate * 100) / 100;
    const tax = gst + pst + hst;
    const total = subtotal + processingFee + tax;

    return { subtotal, processingFee, gst, pst, hst, tax, total };
  }, [lineItems, processingPct, gstRate, pstRate, hstRate]);

  const totalQuantity = lineItems.reduce((s, l) => s + l.quantity, 0);
  const hasPaidItems = lineItems.some((l) => l.price > 0 && l.quantity > 0);

  const setTierQty = (
    targetTierId: number,
    qty: number,
    maxAvailable?: number | null
  ) => {
    const nextQty =
      maxAvailable == null
        ? Math.max(0, Math.min(100, qty))
        : Math.max(0, Math.min(100, maxAvailable, qty));

    setTierQuantities((prev) => ({
      ...prev,
      [targetTierId]: nextQty,
    }));
  };

  const isDirty =
    totalQuantity > 0 ||
    firstName !== defaultName.firstName ||
    lastName !== defaultName.lastName ||
    email !== (user?.email ?? "") ||
    confirmEmail !== (user?.email ?? "");

  const handleClose = () => {
    if (isDirty) setShowCancelDialog(true);
    else onClose();
  };

  const validateForm = () => {
    if (totalQuantity === 0) {
      toast.error("Please select at least one ticket.");
      return false;
    }

    if (!firstName.trim()) {
      toast.error("Please enter your first name.");
      return false;
    }

    if (!lastName.trim()) {
      toast.error("Please enter your last name.");
      return false;
    }

    if (!email.trim()) {
      toast.error("Please enter your email.");
      return false;
    }

    if (!confirmEmail.trim()) {
      toast.error("Please confirm your email.");
      return false;
    }

    if (email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
      toast.error("Emails do not match.");
      return false;
    }

    return true;
  };

  const handleCheckout = async () => {
    if (!validateForm()) return;

    try {
      toast.info("Processing your order...");

      const payloadLineItems =
        tiers.length > 0
          ? lineItems.map((item) => ({
              tierId: item.tierId,
              quantity: item.quantity,
            }))
          : [
              {
                tierId: null,
                quantity: singleQuantity,
              },
            ];

      const result = await createCheckoutMutation.mutateAsync({
        eventId,
        lineItems: payloadLineItems,
        billingProvince,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        confirmEmail: confirmEmail.trim(),
        country,
      });

      if (result.free) {
        toast.success("Tickets acquired!");
        onClose();
        onSuccess?.();
      } else if (result.url) {
        window.location.href = result.url;
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } catch (error: any) {
      const msg = error?.message ?? "";
      if (msg.includes("UNAUTHORIZED")) {
        toast.error("Please sign in to purchase tickets.");
      } else {
        toast.error(msg || "Failed to process checkout.");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {showCancelDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Discard checkout?</h3>
            </div>
            <p className="mb-5 text-sm leading-relaxed text-gray-500">
              Your ticket selections and contact details will be lost if you close now.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="h-10 flex-1 rounded-xl text-sm"
                onClick={() => setShowCancelDialog(false)}
              >
                Keep editing
              </Button>
              <Button
                className="h-10 flex-1 rounded-xl bg-gray-900 text-sm text-white hover:bg-gray-800"
                onClick={() => {
                  setShowCancelDialog(false);
                  onClose();
                }}
              >
                Discard
              </Button>
            </div>
          </div>
        </div>
      )}

      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <div className="flex max-h-[92dvh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:max-w-md sm:rounded-2xl">
          <div className="shrink-0 border-b border-gray-100 px-6 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-gray-900">Get Tickets</h2>
                <p className="mt-0.5 line-clamp-1 text-xs text-gray-400">{eventTitle}</p>
              </div>
              <button
                onClick={handleClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
            <section className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                {tiers.length > 1 ? "Select tickets" : "Tickets"}
              </p>

              {tiersLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
                  ))}
                </div>
              ) : tiers.length > 0 ? (
                <div className="space-y-2">
                  {tiers.map((tier) => {
                    const tierPrice = Number(tier.price);
                    const qty = tierQuantities[tier.id] ?? 0;
                    const remaining =
                      tier.quantity == null
                        ? null
                        : Math.max(0, Number(tier.quantity) - Number(tier.sold ?? 0));
                    const available = remaining == null ? true : remaining > 0;
                    const maxSelectable = remaining == null ? 100 : Math.min(100, remaining);

                    return (
                      <div
                        key={tier.id}
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                          qty > 0 ? "border-slate-400 bg-slate-50" : "border-gray-200"
                        } ${!available ? "opacity-40" : ""}`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {tier.name}
                          </p>
                          {tier.description && (
                            <p className="mt-0.5 truncate text-xs text-gray-400">
                              {tier.description}
                            </p>
                          )}
                          <p
                            className={`mt-0.5 text-sm font-bold ${
                              tierPrice === 0 ? "text-green-600" : "text-gray-700"
                            }`}
                          >
                            {tierPrice === 0 ? "Free" : `CAD $${tierPrice.toFixed(2)}`}
                          </p>
                          {!available ? (
                            <p className="mt-0.5 text-xs text-red-500">Sold out</p>
                          ) : remaining !== null ? (
                            <p className="mt-0.5 text-xs text-gray-400">
                              {remaining} remaining
                            </p>
                          ) : null}
                        </div>

                        <div className="shrink-0 rounded-lg border border-gray-200 bg-white p-0.5">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setTierQty(tier.id, qty - 1, maxSelectable)}
                              disabled={qty === 0 || !available}
                              className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <Minus className="h-3.5 w-3.5 text-gray-600" />
                            </button>
                            <span className="w-5 text-center text-sm font-bold tabular-nums text-gray-900">
                              {qty}
                            </span>
                            <button
                              onClick={() => setTierQty(tier.id, qty + 1, maxSelectable)}
                              disabled={!available || qty >= maxSelectable}
                              className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <Plus className="h-3.5 w-3.5 text-gray-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900">
                    {isFree ? "Free admission" : `${formatMoney(rawUnitPrice)} per ticket`}
                  </p>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSingleQuantity((q) => Math.max(1, q - 1))}
                        disabled={singleQuantity === 1}
                        className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Minus className="h-3.5 w-3.5 text-gray-600" />
                      </button>
                      <span className="w-5 text-center text-sm font-bold tabular-nums text-gray-900">
                        {singleQuantity}
                      </span>
                      <button
                        onClick={() => setSingleQuantity((q) => Math.min(100, q + 1))}
                        disabled={singleQuantity === 100}
                        className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Plus className="h-3.5 w-3.5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Contact details
              </p>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={inputCls}
                />
                <input
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={inputCls}
                />
              </div>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
              />
              <input
                type="email"
                placeholder="Confirm email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                className={inputCls}
              />
            </section>

            <section className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Billing location
              </p>
              <SelectField value={country} onChange={(v) => setCountry(v as CountryCode)}>
                {COUNTRY_OPTIONS.map((o) => (
                  <option key={o.code} value={o.code}>
                    {o.label}
                  </option>
                ))}
              </SelectField>
              <SelectField
                value={billingProvince}
                onChange={(v) => setBillingProvince(v as ProvinceCode)}
              >
                {PROVINCE_OPTIONS.map((o) => (
                  <option key={o.code} value={o.code}>
                    {o.label}
                  </option>
                ))}
              </SelectField>
            </section>

            <p className="text-[11px] leading-relaxed text-gray-400">
              By proceeding you agree to our terms. Tickets are non-refundable unless
              the event is cancelled.
            </p>
          </div>

          <div className="shrink-0 border-t border-gray-100">
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                summaryExpanded ? "max-h-80" : "max-h-0"
              }`}
            >
              <div className="space-y-2.5 border-b border-gray-100 bg-gray-50 px-6 pb-2 pt-4">
                {lineItems.map((l, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      {l.name} × {l.quantity}
                    </span>
                    <span className="font-medium text-gray-800">
                      {l.price === 0 ? "Free" : formatMoney(l.price * l.quantity)}
                    </span>
                  </div>
                ))}

                {hasPaidItems && (
                  <div className="space-y-2 border-t border-gray-200 pt-2">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>
                        Processing fee ({isInternational ? "6%" : "5%"} + $1.50)
                      </span>
                      <span>{formatMoney(preview.processingFee)}</span>
                    </div>
                    {preview.gst > 0 && (
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>GST ({(gstRate * 100).toFixed(0)}%)</span>
                        <span>{formatMoney(preview.gst)}</span>
                      </div>
                    )}
                    {preview.pst > 0 && (
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>PST ({(pstRate * 100).toFixed(0)}%)</span>
                        <span>{formatMoney(preview.pst)}</span>
                      </div>
                    )}
                    {preview.hst > 0 && (
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>HST ({(hstRate * 100).toFixed(0)}%)</span>
                        <span>{formatMoney(preview.hst)}</span>
                      </div>
                    )}
                    <p className="pt-1 text-[10px] text-gray-300">
                      Estimate only — confirmed server-side at checkout
                    </p>
                  </div>
                )}
              </div>
            </div>

            {totalQuantity > 0 && (
              <button
                onClick={() => setSummaryExpanded((v) => !v)}
                className="flex w-full items-center justify-between px-6 py-3 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700">
                    {totalQuantity} ticket{totalQuantity !== 1 ? "s" : ""}
                  </span>
                  <ChevronUp
                    className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                      summaryExpanded ? "" : "rotate-180"
                    }`}
                  />
                </div>
                <span className="text-base font-bold text-gray-900">
                  {preview.total === 0 ? "Free" : formatMoney(preview.total)}
                </span>
              </button>
            )}

            <div className="flex gap-3 px-6 pb-5 pt-1">
              <Button
                variant="outline"
                onClick={handleClose}
                className="h-11 flex-1 rounded-xl font-semibold text-gray-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCheckout}
                disabled={
                  createCheckoutMutation.isPending ||
                  tiersLoading ||
                  totalQuantity === 0
                }
                className="h-11 flex-1 rounded-xl bg-gray-900 font-bold text-white hover:bg-gray-800 disabled:opacity-40"
              >
                {createCheckoutMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    {preview.total === 0 ? "Register Free" : "Pay Now"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}