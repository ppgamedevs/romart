"use client";
import { useEffect, useState } from "react";

export const dynamic = 'force-dynamic';

export default function CuratorQueue() {
  const [items, setItems] = useState<any[]>([]);
  
  async function load() { 
    const r = await fetch("/api/curation/queue"); 
    if (r.ok) setItems((await r.json()).items); 
  }
  
  async function claim(id: string) { 
    const r = await fetch(`/api/curation/ticket/${id}/claim`, { method: "POST" }); 
    if (r.ok) load(); 
  }
  
  useEffect(() => { 
    load(); 
    const t = setInterval(load, 8000); 
    return () => clearInterval(t); 
  }, []);
  
  useEffect(() => { 
    const h = setInterval(() => 
      fetch("/api/curation/me/heartbeat", { method: "POST" }), 60000
    ); 
    return () => clearInterval(h); 
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Unassigned Tickets</h1>
      <ul className="mt-4 divide-y">
        {items.map(t => (
          <li key={t.id} className="py-3 flex items-center justify-between">
            <div>
              <div className="text-sm">{t.subject}</div>
              <div className="text-xs opacity-70">
                {t.type} · created {new Date(t.createdAt).toLocaleString()}
              </div>
            </div>
            <button 
              onClick={() => claim(t.id)} 
              className="px-3 py-1.5 rounded-lg bg-black text-white text-sm"
            >
              Claim
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
