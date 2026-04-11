// components/checkout/TaxBreakdown.tsx
type Props = {
  breakdown: {
    subtotal: number;
    gst: number;
    pst: number;
    hst: number;
    serviceFee: number;
    total: number;
    taxRateLabel: string;
  };
};

export function TaxBreakdown({ breakdown }: Props) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(n);

  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-slate-600">Subtotal</span>
        <span>{fmt(breakdown.subtotal)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-slate-600">Service Fee (3%)</span>
        <span>{fmt(breakdown.serviceFee)}</span>
      </div>
      {breakdown.gst > 0 && (
        <div className="flex justify-between">
          <span className="text-slate-600">GST (5%)</span>
          <span>{fmt(breakdown.gst)}</span>
        </div>
      )}
      {breakdown.pst > 0 && (
        <div className="flex justify-between">
          <span className="text-slate-600">PST</span>
          <span>{fmt(breakdown.pst)}</span>
        </div>
      )}
      {breakdown.hst > 0 && (
        <div className="flex justify-between">
          <span className="text-slate-600">HST</span>
          <span>{fmt(breakdown.hst)}</span>
        </div>
      )}
      <div className="flex justify-between border-t pt-2 font-semibold">
        <span>Total</span>
        <span>{fmt(breakdown.total)}</span>
      </div>
      <p className="text-xs text-slate-400">
        Taxes based on {breakdown.taxRateLabel} billing address
      </p>
    </div>
  );
}