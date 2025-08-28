"use client";
import { useEffect, useState } from "react";

export default function PriceBreakdown({ 
  artworkId, 
  editionId, 
  country = "RO" 
}: {
  artworkId: string; 
  editionId?: string | null; 
  country?: string;
}) {
  const [q, setQ] = useState<any | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL((process.env.NEXT_PUBLIC_API_URL || "") + "/public/price/quote");
    url.searchParams.set("artworkId", artworkId);
    if (editionId) url.searchParams.set("editionId", editionId);
    url.searchParams.set("country", country);
    fetch(url.toString())
      .then(r => r.json())
      .then(setQ)
      .catch(e => setErr(String(e)));
  }, [artworkId, editionId, country]);

  if (err) return null;
  if (!q) return <div className="text-sm opacity-60">Calculating price…</div>;

  return (
    <div className="text-sm space-y-1">
      <div className="flex justify-between">
        <span>Price</span>
        <span>{(q.unit.listMinor / 100).toFixed(2)} {q.currency}</span>
      </div>
      {q.unit.discountsMinor < 0 && (
        <div className="flex justify-between text-emerald-700">
          <span>Promotion</span>
          <span>{(q.unit.discountsMinor / 100).toFixed(2)} {q.currency}</span>
        </div>
      )}
      <div className="flex justify-between">
        <span>VAT</span>
        <span>{(q.unit.vatMinor / 100).toFixed(2)} {q.currency}</span>
      </div>
      <div className="flex justify-between">
        <span>Subtotal</span>
        <span>{(q.unit.subtotalMinor / 100).toFixed(2)} {q.currency}</span>
      </div>
      <div className="flex justify-between">
        <span>Shipping</span>
        <span>
          {q.freeShippingApplied 
            ? "FREE" 
            : ((q.shippingMinor / 100).toFixed(2) + " " + q.currency)
          }
        </span>
      </div>
      <div className="mt-2 flex justify-between font-semibold">
        <span>Total</span>
        <span>{(q.totalMinor / 100).toFixed(2)} {q.currency}</span>
      </div>
      {q.freeShippingApplied && (
        <div className="text-xs text-emerald-700 mt-1">Free shipping applied</div>
      )}
    </div>
  );
}
