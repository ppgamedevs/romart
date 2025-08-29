"use client";
import { useEffect, useState } from "react";

export default function AdminArtistExhibitions({ params }: { params: { id: string } }) {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<any>({
    type: "SOLO",
    title: "",
    venue: "",
    city: "",
    country: "",
    startDate: "",
    endDate: "",
    url: "",
    highlight: false,
    sortIndex: 0
  });

  async function load() {
    const r = await fetch(`/api/admin/artist/${params.id}/exhibitions`);
    const j = await r.json();
    setItems(j.items || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    await fetch(`/api/admin/artist/${params.id}/exhibitions/upsert`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form)
    });
    setForm({ type: "SOLO", title: "" });
    load();
  }

  async function del(id: string) {
    await fetch(`/api/admin/exhibitions/${id}/delete`, { method: "POST" });
    load();
  }

  async function verify(on: boolean) {
    await fetch(`/api/admin/artist/${params.id}/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ on })
    });
    alert("Updated");
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Artist Exhibitions</h1>
      <div className="flex gap-2">
        <button className="px-3 py-1.5 rounded bg-black text-white" onClick={() => verify(true)}>
          Verify artist
        </button>
        <button className="px-3 py-1.5 rounded border" onClick={() => verify(false)}>
          Unverify
        </button>
      </div>
      <div className="rounded-2xl border p-4 grid md:grid-cols-3 gap-2 text-sm">
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="border rounded px-2 py-1"
        >
          <option>SOLO</option>
          <option>GROUP</option>
        </select>
        <input
          placeholder="Title"
          className="border rounded px-2 py-1 md:col-span-2"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          placeholder="Venue"
          className="border rounded px-2 py-1"
          value={form.venue || ""}
          onChange={(e) => setForm({ ...form, venue: e.target.value })}
        />
        <input
          placeholder="City"
          className="border rounded px-2 py-1"
          value={form.city || ""}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
        />
        <input
          placeholder="Country"
          className="border rounded px-2 py-1"
          value={form.country || ""}
          onChange={(e) => setForm({ ...form, country: e.target.value })}
        />
        <input
          type="date"
          className="border rounded px-2 py-1"
          value={form.startDate || ""}
          onChange={(e) => setForm({ ...form, startDate: e.target.value })}
        />
        <input
          type="date"
          className="border rounded px-2 py-1"
          value={form.endDate || ""}
          onChange={(e) => setForm({ ...form, endDate: e.target.value })}
        />
        <input
          placeholder="URL"
          className="border rounded px-2 py-1 md:col-span-2"
          value={form.url || ""}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!form.highlight}
            onChange={(e) => setForm({ ...form, highlight: e.target.checked })}
          />
          Highlight
        </label>
        <input
          type="number"
          className="border rounded px-2 py-1"
          value={form.sortIndex || 0}
          onChange={(e) => setForm({ ...form, sortIndex: parseInt(e.target.value || "0", 10) })}
        />
        <button onClick={save} className="px-3 py-1.5 rounded bg-black text-white md:col-span-3">
          Save
        </button>
      </div>
      <table className="w-full text-sm border rounded-2xl overflow-hidden">
        <thead className="bg-neutral-50">
          <tr>
            <th className="p-2 text-left">Type</th>
            <th className="p-2 text-left">Title</th>
            <th className="p-2 text-left">Place</th>
            <th className="p-2 text-left">Dates</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((e: any) => (
            <tr key={e.id} className="border-t">
              <td className="p-2">{e.type}</td>
              <td className="p-2">{e.title}</td>
              <td className="p-2">{[e.venue, e.city, e.country].filter(Boolean).join(", ")}</td>
              <td className="p-2">
                {e.startDate?.slice(0, 10)} {e.endDate ? "– " + e.endDate.slice(0, 10) : ""}
              </td>
              <td className="p-2 text-right">
                <button onClick={() => del(e.id)} className="px-2 py-1 rounded border">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
