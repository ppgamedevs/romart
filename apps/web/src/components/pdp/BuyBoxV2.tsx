"use client";
import { useState } from "react";

type Props = {
  artworkId: string;
  slug: string;
  artistName: string;
  title: string;
  baseCurrency?: string;
  formats: string[];
  sizes: Array<{ key: string; label: string; widthCm: number; heightCm: number }>;
  destCountry: string;
  soldOut: boolean;
  defaultFormat?: string;
  defaultSizeKey?: string;
};

export default function BuyBoxV2(p: Props) {
  const [format, setFormat] = useState(p.defaultFormat || p.formats[0] || "ORIGINAL");
  const [sizeKey, setSizeKey] = useState(p.defaultSizeKey || p.sizes?.[0]?.key || "");
  const [qty, setQty] = useState(1);

  return (
    <aside className="rounded-2xl border p-4 md:sticky md:top-20">
      <div className="text-lg font-semibold">{p.title}</div>
      <div className="text-sm opacity-70">{p.artistName}</div>

      {/* Price */}
      <div className="mt-3">
        <div className="text-2xl font-semibold">
          Price: TBD
        </div>
        <div className="text-xs opacity-70">TVA inclus • {p.baseCurrency || "EUR"}</div>
      </div>

      {/* Format */}
      <div className="mt-4">
        <div className="text-sm font-medium mb-1">Format</div>
        <div className="flex flex-wrap gap-2">
          {p.formats.map(f => (
            <button 
              key={f} 
              disabled={p.soldOut && f === "ORIGINAL"}
              onClick={() => setFormat(f)}
              className={`px-3 py-1.5 rounded-full border text-sm ${format === f ? "bg-black text-white" : ""} disabled:opacity-40`}
            >
              {f === "ORIGINAL" ? "Original" : f === "CANVAS" ? "Canvas" : f === "METAL" ? "Metal" : "Photo"}
            </button>
          ))}
        </div>
      </div>

      {/* Size */}
      {format !== "ORIGINAL" && (
        <div className="mt-3">
          <div className="text-sm font-medium mb-1">Size</div>
          <div className="grid grid-cols-2 gap-2">
            {p.sizes.map(s => (
              <button 
                key={s.key} 
                onClick={() => setSizeKey(s.key)}
                className={`px-3 py-2 rounded-xl border text-sm ${sizeKey === s.key ? "bg-black text-white" : ""}`}
              >
                {s.label} <span className="block text-[11px] opacity-70">{s.widthCm}×{s.heightCm} cm</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div className="mt-4">
        <div className="text-sm font-medium mb-1">Quantity</div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="w-8 h-8 rounded-full border flex items-center justify-center"
          >
            −
          </button>
          <span className="w-8 text-center">{qty}</span>
          <button 
            onClick={() => setQty(qty + 1)}
            className="w-8 h-8 rounded-full border flex items-center justify-center"
          >
            +
          </button>
        </div>
      </div>

      {/* Add to Cart */}
      <button 
        disabled={p.soldOut}
        className="w-full mt-6 py-3 bg-black text-white rounded-xl font-medium disabled:opacity-40"
      >
        {p.soldOut ? "Sold Out" : "Add to Cart"}
      </button>
    </aside>
  );
}
