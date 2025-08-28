"use client";
import { useEffect, useState } from "react";

type Row = { id?: string; kind: string; sizeLabel: string; baseMinor: number; packagingMinor: number; leadDays: number; active: boolean };

export default function CostingAdmin() {
  const [items, setItems] = useState<Row[]>([]);
  const [form, setForm] = useState<Row>({ kind: "CANVAS", sizeLabel: "30x40", baseMinor: 0, packagingMinor: 0, leadDays: 5, active: true });

  async function load() { 
    const r = await fetch("/api/admin/print-costs"); 
    const j = await r.json(); 
    setItems(j.items || []); 
  }
  useEffect(() => { load(); }, []);

  async function save() {
    await fetch("/api/admin/print-costs/upsert", { 
      method: "POST", 
      headers: { "content-type": "application/json" }, 
      body: JSON.stringify(form) 
    });
    setForm({ kind: "CANVAS", sizeLabel: "30x40", baseMinor: 0, packagingMinor: 0, leadDays: 5, active: true });
    load();
  }
  async function del(id: string) { 
    await fetch(`/api/admin/print-costs/${id}/delete`, { method: "POST" }); 
    load(); 
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Print Cost Table</h1>

      <div className="rounded-xl border p-4 grid md:grid-cols-6 gap-3 text-sm">
        <select value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value })} className="border rounded-lg px-2 py-1">
          <option>CANVAS</option>
          <option>METAL</option>
          <option>PHOTO</option>
        </select>
        <input placeholder="sizeLabel" value={form.sizeLabel} onChange={e => setForm({ ...form, sizeLabel: e.target.value })} className="border rounded-lg px-2 py-1" />
        <input placeholder="base (minor)" type="number" value={form.baseMinor} onChange={e => setForm({ ...form, baseMinor: +e.target.value })} className="border rounded-lg px-2 py-1" />
        <input placeholder="packaging (minor)" type="number" value={form.packagingMinor} onChange={e => setForm({ ...form, packagingMinor: +e.target.value })} className="border rounded-lg px-2 py-1" />
        <input placeholder="leadDays" type="number" value={form.leadDays} onChange={e => setForm({ ...form, leadDays: +e.target.value })} className="border rounded-lg px-2 py-1" />
        <button onClick={save} className="rounded-lg bg-black text-white px-3">Save/Upsert</button>
      </div>

      <table className="w-full text-sm border">
        <thead className="bg-neutral-50">
          <tr>
            <th className="p-2 text-left">Kind</th>
            <th className="p-2">Size</th>
            <th className="p-2">Base</th>
            <th className="p-2">Pack</th>
            <th className="p-2">Lead</th>
            <th className="p-2">Active</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {items.map(r => (
            <tr key={r.id} className="border-t">
              <td className="p-2">{r.kind}</td>
              <td className="p-2">{r.sizeLabel}</td>
              <td className="p-2">{(r.baseMinor / 100).toFixed(2)} €</td>
              <td className="p-2">{(r.packagingMinor / 100).toFixed(2)} €</td>
              <td className="p-2">{r.leadDays}d</td>
              <td className="p-2">{r.active ? "✓" : "—"}</td>
              <td className="p-2">
                <button onClick={() => del(r.id!)} className="text-red-600">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
