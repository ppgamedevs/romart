"use client";
import { useEffect, useState } from "react";

export const dynamic = 'force-dynamic';

export default function AdminCuratorPayouts() {
  const [preview, setPreview] = useState<any>(null);
  const [res, setRes] = useState<any>(null);

  async function load() { 
    const r = await fetch("/api/admin/curators/payouts/preview"); 
    if (r.ok) setPreview(await r.json()); 
  }
  
  async function createBatch() { 
    const r = await fetch("/api/admin/curators/payouts/create", {
      method: "POST", 
      headers: { "content-type": "application/json" }, 
      body: JSON.stringify({})
    }); 
    setRes(await r.json()); 
  }
  
  async function processBatch() { 
    if (!res?.batchId) return; 
    const r = await fetch(`/api/admin/curators/payouts/${res.batchId}/process`, {
      method: "POST"
    }); 
    const j = await r.json(); 
    alert(JSON.stringify(j, null, 2)); 
  }

  useEffect(() => { load(); }, []);
  
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Curator Payouts</h1>
      
      <div className="rounded-xl border p-3 text-sm">
        <div>Eligible count: {preview?.count || 0}</div>
        <div>Total: {(preview?.totalMinor || 0) / 100} {preview?.items?.[0]?.currency || "EUR"}</div>
        <button 
          onClick={createBatch} 
          className="mt-2 px-3 py-1.5 rounded-lg bg-black text-white"
        >
          Create batch
        </button>
      </div>
      
      {res?.batchId && (
        <div className="rounded-xl border p-3">
          <div className="text-sm">Batch ID: {res.batchId}</div>
          <button 
            onClick={processBatch} 
            className="mt-2 px-3 py-1.5 rounded-lg bg-emerald-600 text-white"
          >
            Process batch
          </button>
        </div>
      )}
    </div>
  );
}
