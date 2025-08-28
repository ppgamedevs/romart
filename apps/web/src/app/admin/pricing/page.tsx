"use client";
import { useEffect, useState } from "react";

export default function AdminPricing() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/admin/price-rules")
      .then(r => r.json())
      .then(d => setItems(d.items || []));
  }, []);

  async function toggle(id: string, active: boolean) {
    await fetch(`/api/admin/price-rules/${id}/toggle`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active })
    });
    setItems(it => it.map(x => x.id === id ? { ...x, active } : x));
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Price Rules</h1>
      <ul className="mt-4 divide-y">
        {items.map(r => (
          <li key={r.id} className="py-3 flex items-center gap-3">
            <div className="flex-1">
              <div className="font-medium">{r.name}</div>
              <div className="text-xs opacity-70">
                {r.scope} · priority {r.priority} · {r.stackable ? "stack" : "solo"}
              </div>
            </div>
            <label className="text-sm flex items-center gap-2">
              <input
                type="checkbox"
                checked={r.active}
                onChange={e => toggle(r.id, e.target.checked)}
              />
              Active
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
