"use client";
import { useEffect, useState } from "react";

export default function AdminSearch() {
  const [syn, setSyn] = useState<any[]>([]);
  const [boosts, setBoosts] = useState<any[]>([]);
  const [s, setS] = useState<any>({ canonical: "", variants: "" });
  const [b, setB] = useState<any>({ scope: "GLOBAL", weight: 0.5, active: true });

  useEffect(() => {
    refresh();
    async function refresh() {
      const s = await fetch("/api/admin/search/synonyms").then(r => r.json());
      const b = await fetch("/api/admin/search/boosts").then(r => r.json());
      setSyn(s.items || []); setBoosts(b.items || []);
    }
  }, []);

  async function saveSyn() {
    await fetch("/api/admin/search/synonyms/upsert", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        canonical: s.canonical,
        variants: s.variants.split(",").map((x: string) => x.trim()).filter(Boolean)
      })
    });
    location.reload();
  }

  async function saveBoost() {
    await fetch("/api/admin/search/boosts/upsert", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(b)
    });
    location.reload();
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-xl font-semibold">Search Tuning</h1>

      <section className="rounded-2xl border p-4 space-y-3">
        <div className="font-medium">Synonyms</div>
        <div className="grid md:grid-cols-3 gap-2 text-sm">
          <input
            placeholder="canonical (ex: portret)"
            className="border rounded px-2 py-1"
            value={s.canonical}
            onChange={e => setS({ ...s, canonical: e.target.value })}
          />
          <input
            placeholder="variants (comma separated)"
            className="border rounded px-2 py-1 md:col-span-2"
            value={s.variants}
            onChange={e => setS({ ...s, variants: e.target.value })}
          />
          <button
            onClick={saveSyn}
            className="px-3 py-1.5 rounded bg-black text-white md:col-span-3"
          >
            Save synonym
          </button>
        </div>
        <ul className="text-sm divide-y">
          {syn.map((x: any) => (
            <li key={x.id} className="py-2">
              {x.canonical} — <span className="opacity-70">{x.variants.join(", ")}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border p-4 space-y-3">
        <div className="font-medium">Boost Rules</div>
        <div className="grid md:grid-cols-4 gap-2 text-sm">
          <select
            className="border rounded px-2 py-1"
            value={b.scope}
            onChange={e => setB({ ...b, scope: e.target.value })}
          >
            <option>GLOBAL</option>
            <option>MEDIUM</option>
            <option>ARTIST</option>
            <option>ARTWORK</option>
            <option>TAG</option>
          </select>
          <input
            placeholder="medium (optional)"
            className="border rounded px-2 py-1"
            value={b.medium || ""}
            onChange={e => setB({ ...b, medium: e.target.value || null })}
          />
          <input
            placeholder="artistId (optional)"
            className="border rounded px-2 py-1"
            value={b.artistId || ""}
            onChange={e => setB({ ...b, artistId: e.target.value || null })}
          />
          <input
            placeholder="artworkId / tag (optional)"
            className="border rounded px-2 py-1"
            value={b.artworkId || b.tag || ""}
            onChange={e => setB({ ...b, artworkId: e.target.value || null, tag: e.target.value || null })}
          />
          <input
            type="number"
            step="0.1"
            placeholder="weight ex 0.5"
            className="border rounded px-2 py-1"
            value={b.weight}
            onChange={e => setB({ ...b, weight: parseFloat(e.target.value) })}
          />
          <input
            type="datetime-local"
            className="border rounded px-2 py-1"
            value={b.startsAt || ""}
            onChange={e => setB({ ...b, startsAt: e.target.value })}
          />
          <input
            type="datetime-local"
            className="border rounded px-2 py-1"
            value={b.endsAt || ""}
            onChange={e => setB({ ...b, endsAt: e.target.value })}
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={b.active ?? true}
              onChange={e => setB({ ...b, active: e.target.checked })}
            />
            Active
          </label>
          <button
            onClick={saveBoost}
            className="px-3 py-1.5 rounded bg-black text-white md:col-span-4"
          >
            Save boost
          </button>
        </div>
        <ul className="text-sm divide-y">
          {boosts.map((x: any) => (
            <li key={x.id} className="py-2">
              {x.scope} · {x.medium || x.tag || x.artistId || x.artworkId || "—"} — w={x.weight}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
