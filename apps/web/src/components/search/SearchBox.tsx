"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBox({ initial="" }:{ initial?:string }){
  const [q,setQ]=useState(initial);
  const [sug,setSug]=useState<any[]>([]);
  const [open,setOpen]=useState(false);
  const router = useRouter();
  const t = useRef<number>();

  useEffect(()=>{
    if(!q){ setSug([]); return; }
    window.clearTimeout(t.current); t.current = window.setTimeout(async ()=>{
      const r = await fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`,{ cache:"no-store" });
      const j = await r.json(); setSug(j.items||[]); setOpen(true);
    }, 120) as any;
  },[q]);

  return (
    <div className="relative">
      <input value={q} onChange={e=>setQ(e.target.value)}
        onKeyDown={(e)=>{ if(e.key==="Enter" && q) router.push(`/discover?q=${encodeURIComponent(q)}`); }}
        placeholder="Search artworks…" className="w-full border rounded-xl px-3 py-2" />
      {open && sug.length>0 && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border bg-white shadow">
          {sug.map((s)=>(
            <button key={s.slug} className="w-full text-left px-3 py-2 hover:bg-neutral-50"
              onClick={()=>router.push(`/artwork/${s.slug}`)}>
              <div className="text-sm">{s.title}</div>
              <div className="text-xs opacity-70">{s.artistName}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
