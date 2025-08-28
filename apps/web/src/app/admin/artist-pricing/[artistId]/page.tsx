"use client";
import { useEffect, useState } from "react";

export default function ArtistPricingPage({ params }: { params: Promise<{ artistId: string }> }) {
  const [p, setP] = useState<any>({});
  const [artistId, setArtistId] = useState<string>("");

  useEffect(() => {
    params.then(({ artistId }) => {
      setArtistId(artistId);
      fetch(`/api/admin/artist-pricing/${artistId}`).then(r => r.json()).then(setP);
    });
  }, [params]);

  async function save() {
    await fetch(`/api/admin/artist-pricing/${artistId}/upsert`, { 
      method: "POST", 
      headers: { "content-type": "application/json" }, 
      body: JSON.stringify(p) 
    });
    alert("Saved");
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Artist Pricing — {artistId}</h1>
      <div className="grid md:grid-cols-3 gap-3 text-sm">
        <label className="flex items-center gap-2">
          Generic markup
          <input 
            type="number" 
            step="0.01" 
            value={p.printMarkupPct ?? ""} 
            onChange={e => setP({ ...p, printMarkupPct: e.target.value === "" ? null : parseFloat(e.target.value) })} 
            className="border rounded-lg px-2 py-1"
          />
        </label>
        <label className="flex items-center gap-2">
          Canvas markup
          <input 
            type="number" 
            step="0.01" 
            value={p.canvasMarkupPct ?? ""} 
            onChange={e => setP({ ...p, canvasMarkupPct: e.target.value === "" ? null : parseFloat(e.target.value) })} 
            className="border rounded-lg px-2 py-1"
          />
        </label>
        <label className="flex items-center gap-2">
          Metal markup
          <input 
            type="number" 
            step="0.01" 
            value={p.metalMarkupPct ?? ""} 
            onChange={e => setP({ ...p, metalMarkupPct: e.target.value === "" ? null : parseFloat(e.target.value) })} 
            className="border rounded-lg px-2 py-1"
          />
        </label>
        <label className="flex items-center gap-2">
          Photo markup
          <input 
            type="number" 
            step="0.01" 
            value={p.photoMarkupPct ?? ""} 
            onChange={e => setP({ ...p, photoMarkupPct: e.target.value === "" ? null : parseFloat(e.target.value) })} 
            className="border rounded-lg px-2 py-1"
          />
        </label>
        <label className="flex items-center gap-2">
          Min margin
          <input 
            type="number" 
            step="0.01" 
            value={p.minMarginPct ?? ""} 
            onChange={e => setP({ ...p, minMarginPct: e.target.value === "" ? null : parseFloat(e.target.value) })} 
            className="border rounded-lg px-2 py-1"
          />
        </label>
        <label className="flex items-center gap-2">
          Rounding
          <select 
            value={p.rounding || "END_00"} 
            onChange={e => setP({ ...p, rounding: e.target.value })} 
            className="border rounded-lg px-2 py-1"
          >
            <option value="NONE">NONE</option>
            <option value="END_00">END_00</option>
            <option value="END_90">END_90</option>
            <option value="END_99">END_99</option>
          </select>
        </label>
      </div>
      <button onClick={save} className="rounded-lg bg-black text-white px-3 py-1.5">Save</button>
    </div>
  );
}
