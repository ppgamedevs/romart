"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Modal from "@/components/ui/Modal";
import SwipeZoomGallery from "@/components/media/SwipeZoomGallery";
import { track } from "@/lib/analytics";

type Edition = { id: string; label: string; priceMinor: number; inStock: boolean; kind?: string };
type QuickViewData = {
  id: string;
  slug: string;
  title: string;
  artistName?: string;
  currency?: string;
  thumbUrl?: string;
  heroUrl?: string;
  medium?: string;
  dimensions?: string;
  images?: string[];
  editions: Edition[];
};

const CART_ADD_ENDPOINT = process.env.NEXT_PUBLIC_CART_ADD_ENDPOINT || "/api/cart/add"; // adaptează la backend-ul tău

export default function QuickViewButton({
  artworkId, slug, currency = "EUR", className = "",
}: { artworkId: string; slug: string; currency?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<QuickViewData | null>(null);
  const [editionId, setEditionId] = useState<string | undefined>(undefined);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const money = useMemo(
    () => (n: number) => new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n / 100),
    [currency]
  );

  async function openQV() {
    setOpen(true);
    if (data) return;
    setLoading(true);
    try {
      const api = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:3001";
      const r = await fetch(`${api}/public/artworks/${artworkId}/quick-view`, { cache: "no-store" });
      if (r.ok) {
        const json = await r.json();
        setData(json);
        if (json.editions?.length) setEditionId(json.editions[0].id);
        track("rec_click" as any, { section: "quickview-open", artworkId }); // CTR pe Quick View
      } else {
        console.error("Quick view 404");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function addToCart() {
    if (!editionId) return alert("Select an option");
    setAdding(true);
    try {
      const r = await fetch(CART_ADD_ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ artworkId, editionId, qty }),
        credentials: "include",
      });
      if (!r.ok) throw new Error("Add to cart failed");
      track("add_to_cart", { artworkId, editionId, qty });
      alert("Added to cart");
      setOpen(false);
      // Trigger cart update event for mini-cart
      window.dispatchEvent(new CustomEvent("cart:updated"));
    } catch (e) {
      console.error(e);
      alert("Couldn't add to cart — check NEXT_PUBLIC_CART_ADD_ENDPOINT");
    } finally {
      setAdding(false);
    }
  }

  return (
    <>
      <button
        onClick={openQV}
        className={
          "px-3 py-1.5 rounded-full border bg-white/80 backdrop-blur hover:bg-white text-xs " +
          className
        }
        aria-haspopup="dialog"
      >
        Quick view
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={data?.title || "Quick view"}>
        {loading && <div className="h-72 animate-pulse bg-neutral-100 rounded-lg" />}

        {!loading && data && (
          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-3 md:space-y-0">
              {/* pe mobil: galerie swipe+pinch */}
              <div className="md:hidden">
                <SwipeZoomGallery 
                  images={data.images?.length ? data.images : [data.heroUrl || data.thumbUrl || "/placeholder.png"]} 
                  alt={data.title} 
                />
              </div>

              {/* pe desktop: o singură imagine mare (sau poți păstra galeria) */}
              <div className="relative aspect-[4/3] bg-neutral-100 rounded-lg overflow-hidden hidden md:block">
                <Image
                  src={(data.images?.[0]) || data.heroUrl || data.thumbUrl || "/placeholder.png"}
                  alt={data.title}
                  fill
                  sizes="(max-width:1200px) 50vw, 600px"
                  className="object-cover"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-lg font-semibold">{data.title}</div>
                {data.artistName && <div className="text-sm opacity-70">by {data.artistName}</div>}
                {data.medium && <div className="text-xs uppercase tracking-wide opacity-70">{data.medium}</div>}
                {data.dimensions && <div className="text-xs opacity-70">{data.dimensions}</div>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Option</label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={editionId}
                  onChange={(e) => setEditionId(e.target.value)}
                >
                  {data.editions.map((ed) => (
                    <option key={ed.id} value={ed.id} disabled={!ed.inStock}>
                      {ed.label} — {money(ed.priceMinor)} {ed.inStock ? "" : "(out of stock)"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm font-medium">Qty</label>
                <input
                  type="number" min={1} value={qty}
                  onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                  className="w-20 border rounded-md px-3 py-2 text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={addToCart}
                  disabled={adding || !editionId}
                  className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50"
                >
                  {adding ? "Adding…" : "Add to cart"}
                </button>
                <a
                  href={`/artwork/${slug}`}
                  className="px-4 py-2 rounded-xl border hover:bg-neutral-100"
                  onClick={() => track("rec_click" as any, { section: "quickview-view-details", artworkId })}
                >
                  View details
                </a>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
