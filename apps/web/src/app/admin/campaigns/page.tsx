"use client";
import { useEffect, useState } from "react";

type Row = any;

export default function CampaignsAdmin() {
  const [items, setItems] = useState<Row[]>([]);
  const [f, setF] = useState<any>({
    name: "",
    scope: "GLOBAL",
    pct: -0.10,
    priority: 50,
    stackable: false,
    startsAt: "",
    endsAt: "",
    active: true,
    ogBadge: true
  });

  async function load() {
    const r = await fetch("/api/admin/campaigns");
    const j = await r.json();
    setItems(j.items || []);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    const r = await fetch("/api/admin/campaigns", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(f)
    });
    if (r.ok) {
      setF({
        name: "",
        scope: "GLOBAL",
        pct: -0.10,
        priority: 50,
        stackable: false,
        startsAt: "",
        endsAt: "",
        active: true,
        ogBadge: true
      });
      load();
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Seasonal Campaigns</h1>

      <div className="rounded-xl border p-4 grid md:grid-cols-4 gap-3 text-sm">
        <input
          className="border rounded-lg px-2 py-1"
          placeholder="Name"
          value={f.name}
          onChange={e => setF({ ...f, name: e.target.value })}
        />
        <select
          className="border rounded-lg px-2 py-1"
          value={f.scope}
          onChange={e => setF({ ...f, scope: e.target.value })}
        >
          <option>GLOBAL</option>
          <option>MEDIUM</option>
          <option>ARTIST</option>
          <option>ARTWORK</option>
          <option>EDITION_KIND</option>
        </select>
        <input
          type="datetime-local"
          className="border rounded-lg px-2 py-1"
          value={f.startsAt}
          onChange={e => setF({ ...f, startsAt: e.target.value })}
        />
        <input
          type="datetime-local"
          className="border rounded-lg px-2 py-1"
          value={f.endsAt}
          onChange={e => setF({ ...f, endsAt: e.target.value })}
        />

        <div className="grid grid-cols-3 gap-2 col-span-full">
          <input
            type="number"
            step="0.01"
            className="border rounded-lg px-2 py-1"
            placeholder="pct ex -0.10"
            value={f.pct ?? ""}
            onChange={e => setF({ ...f, pct: e.target.value === "" ? null : parseFloat(e.target.value) })}
          />
          <input
            type="number"
            className="border rounded-lg px-2 py-1"
            placeholder="addMinor ex -1000"
            value={f.addMinor ?? ""}
            onChange={e => setF({ ...f, addMinor: e.target.value === "" ? null : parseInt(e.target.value, 10) })}
          />
          <input
            type="number"
            className="border rounded-lg px-2 py-1"
            placeholder="cap (minor)"
            value={f.maxDiscountMinor ?? ""}
            onChange={e => setF({ ...f, maxDiscountMinor: e.target.value === "" ? null : parseInt(e.target.value, 10) })}
          />
        </div>

        <div className="grid grid-cols-4 gap-2 col-span-full">
          <input
            className="border rounded-lg px-2 py-1"
            placeholder="medium (optional)"
            value={f.medium ?? ""}
            onChange={e => setF({ ...f, medium: e.target.value || null })}
          />
          <input
            className="border rounded-lg px-2 py-1"
            placeholder="artistId (optional)"
            value={f.artistId ?? ""}
            onChange={e => setF({ ...f, artistId: e.target.value || null })}
          />
          <input
            className="border rounded-lg px-2 py-1"
            placeholder="artworkId (optional)"
            value={f.artworkId ?? ""}
            onChange={e => setF({ ...f, artworkId: e.target.value || null })}
          />
          <input
            className="border rounded-lg px-2 py-1"
            placeholder="editionKind (ORIGINAL/CANVAS/METAL/PHOTO)"
            value={f.editionKind ?? ""}
            onChange={e => setF({ ...f, editionKind: e.target.value || null })}
          />
        </div>

        <div className="flex items-center gap-3 col-span-full">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={f.stackable}
              onChange={e => setF({ ...f, stackable: e.target.checked })}
            />
            Stackable
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={f.active}
              onChange={e => setF({ ...f, active: e.target.checked })}
            />
            Active
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={f.ogBadge}
              onChange={e => setF({ ...f, ogBadge: e.target.checked })}
            />
            Show OG Badge
          </label>
          <input
            type="number"
            className="border rounded-lg px-2 py-1"
            placeholder="priority"
            value={f.priority}
            onChange={e => setF({ ...f, priority: parseInt(e.target.value, 10) || 0 })}
          />
          <button
            onClick={save}
            className="ml-auto px-3 py-1.5 rounded-lg bg-black text-white"
          >
            Save / Upsert
          </button>
        </div>
      </div>

      <table className="w-full text-sm border">
        <thead className="bg-neutral-50">
          <tr>
            <th className="p-2 text-left">Name</th>
            <th className="p-2">Scope</th>
            <th className="p-2">When</th>
            <th className="p-2">Effect</th>
            <th className="p-2">Priority</th>
            <th className="p-2">Active</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r: any) => (
            <tr key={r.id} className="border-t">
              <td className="p-2">{r.name}</td>
              <td className="p-2">
                {r.scope}
                {r.medium ? ` · ${r.medium}` : ""}
                {r.editionKind ? ` · ${r.editionKind}` : ""}
                {r.artistId ? ` · artist` : ""}
                {r.artworkId ? ` · artwork` : ""}
              </td>
              <td className="p-2">
                {new Date(r.startsAt).toLocaleString()} → {new Date(r.endsAt).toLocaleString()}
              </td>
              <td className="p-2">
                {r.pct ? `${(r.pct * 100).toFixed(0)}%` : ""}
                {r.addMinor ? ` ${(r.addMinor / 100).toFixed(2)}€` : ""}
                {r.maxDiscountMinor ? ` (cap ${(r.maxDiscountMinor / 100).toFixed(2)}€)` : ""}
              </td>
              <td className="p-2">{r.priority}</td>
              <td className="p-2">{r.active ? "✓" : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
