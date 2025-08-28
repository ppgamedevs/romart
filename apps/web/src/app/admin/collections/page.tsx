"use client";
import { useEffect, useState } from "react";

export default function AdminCollections() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ 
    slug: "", 
    title: "", 
    subtitle: "", 
    coverImageUrl: "", 
    heroTone: "DARK", 
    isFeatured: false, 
    sortIndex: 0, 
    publishedAt: "", 
    items: [] 
  });

  async function load() { 
    const r = await fetch("/api/admin/collections"); 
    const j = await r.json(); 
    setItems(j.items || []); 
  }
  
  async function save() {
    await fetch("/api/admin/collections/upsert", { 
      method: "POST", 
      headers: { "content-type": "application/json" }, 
      body: JSON.stringify(form) 
    });
    setForm({ slug: "", title: "", items: [] }); 
    load();
  }
  
  useEffect(() => { load(); }, []);

  function addArtwork(artworkId: string) { 
    setForm((f: any) => ({ 
      ...f, 
      items: [...f.items, { artworkId, sortIndex: f.items.length }] 
    })); 
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Collections</h1>
      <div className="grid md:grid-cols-3 gap-3 text-sm rounded-xl border p-4">
        <input 
          placeholder="slug" 
          className="border rounded-lg px-2 py-1" 
          value={form.slug || ""} 
          onChange={e => setForm({ ...form, slug: e.target.value })}
        />
        <input 
          placeholder="title" 
          className="border rounded-lg px-2 py-1" 
          value={form.title || ""} 
          onChange={e => setForm({ ...form, title: e.target.value })}
        />
        <input 
          placeholder="subtitle" 
          className="border rounded-lg px-2 py-1" 
          value={form.subtitle || ""} 
          onChange={e => setForm({ ...form, subtitle: e.target.value })}
        />
        <input 
          placeholder="coverImageUrl" 
          className="border rounded-lg px-2 py-1 md:col-span-2" 
          value={form.coverImageUrl || ""} 
          onChange={e => setForm({ ...form, coverImageUrl: e.target.value })}
        />
        <select 
          className="border rounded-lg px-2 py-1" 
          value={form.heroTone} 
          onChange={e => setForm({ ...form, heroTone: e.target.value })}
        >
          <option>DARK</option>
          <option>LIGHT</option>
        </select>
        <label className="flex items-center gap-2">
          <input 
            type="checkbox" 
            checked={!!form.isFeatured} 
            onChange={e => setForm({ ...form, isFeatured: e.target.checked })}
          /> 
          Featured
        </label>
        <input 
          placeholder="sortIndex" 
          type="number" 
          className="border rounded-lg px-2 py-1" 
          value={form.sortIndex || 0} 
          onChange={e => setForm({ ...form, sortIndex: parseInt(e.target.value, 10) || 0 })}
        />
        <input 
          type="datetime-local" 
          className="border rounded-lg px-2 py-1" 
          value={form.publishedAt || ""} 
          onChange={e => setForm({ ...form, publishedAt: e.target.value })}
        />
        <div className="md:col-span-3">
          <div className="text-xs opacity-70 mb-1">Items (artworkId · sortIndex)</div>
          <ul className="space-y-1">
            {(form.items || []).map((it: any, idx: number) => (
              <li key={idx} className="flex gap-2 items-center">
                <input 
                  className="border rounded px-2 py-1 text-xs flex-1" 
                  value={it.artworkId} 
                  onChange={e => setForm((f: any) => { 
                    const a = [...f.items]; 
                    a[idx] = { ...a[idx], artworkId: e.target.value }; 
                    return { ...f, items: a }; 
                  })}
                />
                <input 
                  className="border rounded px-2 py-1 text-xs w-20" 
                  type="number" 
                  value={it.sortIndex} 
                  onChange={e => setForm((f: any) => { 
                    const a = [...f.items]; 
                    a[idx] = { ...a[idx], sortIndex: parseInt(e.target.value, 10) || 0 }; 
                    return { ...f, items: a }; 
                  })}
                />
              </li>
            ))}
          </ul>
          <button 
            onClick={() => addArtwork("")} 
            className="mt-2 px-3 py-1.5 rounded-lg border"
          >
            Add item
          </button>
        </div>
        <button 
          onClick={save} 
          className="md:col-span-3 px-3 py-1.5 rounded-lg bg-black text-white"
        >
          Save / Upsert
        </button>
      </div>

      <table className="w-full text-sm border">
        <thead className="bg-neutral-50">
          <tr>
            <th className="p-2 text-left">Title</th>
            <th className="p-2">Slug</th>
            <th className="p-2">Featured</th>
            <th className="p-2">Published</th>
          </tr>
        </thead>
        <tbody>
          {items.map((c: any) => (
            <tr key={c.id} className="border-t">
              <td className="p-2">{c.title}</td>
              <td className="p-2">{c.slug}</td>
              <td className="p-2">{c.isFeatured ? "✓" : "—"}</td>
              <td className="p-2">
                {c.publishedAt ? new Date(c.publishedAt).toLocaleString() : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
