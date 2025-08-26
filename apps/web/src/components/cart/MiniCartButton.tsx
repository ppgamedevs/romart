"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type MiniItem = {
  id: string;
  qty: number;
  editionId: string;
  editionLabel: string;
  unitAmount: number;
  artwork: { id: string; title: string; slug: string; thumbUrl?: string };
};
type MiniCart = { items: MiniItem[]; count: number; totalMinor: number; currency: string };

function fmt(minor: number, currency = "EUR") {
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(minor/100); }
  catch { return (minor/100).toFixed(2) + " €"; }
}

export default function MiniCartButton() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<MiniCart>({ items: [], count: 0, totalMinor: 0, currency: "EUR" });

  async function load() {
    try {
      const r = await fetch("/api/cart/mini", { cache: "no-store", credentials: "include" });
      if (!r.ok) return;
      const json = await r.json();
      setData(json);
    } catch {}
  }

  useEffect(() => {
    load();
    const onUpdate = () => load();
    window.addEventListener("cart:updated", onUpdate);
    return () => window.removeEventListener("cart:updated", onUpdate);
  }, []);

  // click-outside close
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!open) return;
      const p = (e.target as HTMLElement).closest("#minicart-popover");
      const b = (e.target as HTMLElement).closest("#minicart-button");
      if (!p && !b) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div className="relative">
      <button
        id="minicart-button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-xl border px-3 py-1.5 hover:bg-neutral-50"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="minicart-popover"
        title="Open cart"
      >
        🛒
        {data.count > 0 && (
          <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] rounded-full px-1.5 py-0.5">
            {data.count}
          </span>
        )}
      </button>

      {open && (
        <div
          id="minicart-popover"
          className="absolute right-0 mt-2 w-[360px] max-h-[70vh] overflow-auto rounded-2xl border bg-white shadow-2xl p-3 z-50"
          role="dialog"
          aria-label="Mini cart"
        >
          <h3 className="text-sm font-semibold mb-2">Your cart</h3>

          {data.items.length === 0 ? (
            <div className="text-sm opacity-70 py-6 text-center">Cart is empty.</div>
          ) : (
            <ul className="space-y-3">
              {data.items.map((it) => (
                <li key={it.id} className="flex gap-3">
                  <div className="relative w-16 h-12 bg-neutral-100 rounded overflow-hidden shrink-0">
                    {it.artwork.thumbUrl && (
                      <Image src={it.artwork.thumbUrl} alt={it.artwork.title} fill sizes="64px" className="object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 grow">
                    <div className="text-sm font-medium line-clamp-1">{it.artwork.title}</div>
                    <div className="text-xs opacity-70">{it.editionLabel}</div>
                    <div className="text-xs mt-0.5">Qty {it.qty}</div>
                  </div>
                  <div className="text-sm font-semibold">{fmt(it.unitAmount * it.qty, data.currency)}</div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm opacity-70">Subtotal</div>
            <div className="text-base font-semibold">{fmt(data.totalMinor, data.currency)}</div>
          </div>

          <div className="mt-3 flex gap-2">
            <Link href="/cart" className="w-1/2 text-center px-4 py-2 rounded-xl border hover:bg-neutral-50">View cart</Link>
            <Link href="/checkout" className="w-1/2 text-center px-4 py-2 rounded-xl bg-black text-white">Checkout</Link>
          </div>
        </div>
      )}
    </div>
  );
}
