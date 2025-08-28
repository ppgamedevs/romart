"use client";
import { useEffect, useState } from "react";

export const dynamic = 'force-dynamic';

export default function CuratorPayoutsPage() {
  const [state, setState] = useState<any>({ 
    profile: null, 
    summary: null, 
    onboardingUrl: null, 
    loading: true, 
    err: null 
  });

  async function load() {
    try {
      const r1 = await fetch("/api/studio/curator/profile"); // proxy simplu (vezi mai jos)
      const profile = r1.ok ? await r1.json() : null;
      const r2 = await fetch("/api/studio/curator/summary");
      const summary = r2.ok ? await r2.json() : null;
      setState((s: any) => ({ ...s, profile, summary, loading: false }));
    } catch (e: any) { 
      setState((s: any) => ({ ...s, loading: false, err: e.message })); 
    }
  }

  async function connectStripe() {
    const r = await fetch("/api/studio/curator/stripe/onboarding", { method: "POST" });
    const j = await r.json(); 
    if (j?.url) window.location.href = j.url;
  }

  useEffect(() => { load(); }, []);

  const p = state.profile;
  
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Payouts</h1>
      
      {p?.payoutMethod === "STRIPE_CONNECT" && !p?.payoutsEnabled && (
        <div className="rounded-xl border bg-yellow-50 p-3 text-sm">
          <div>Complete your Stripe Express onboarding to receive payouts.</div>
          <button 
            onClick={connectStripe} 
            className="mt-2 px-3 py-1.5 rounded-lg bg-black text-white"
          >
            Connect Stripe
          </button>
        </div>
      )}
      
      <div className="rounded-xl border p-3 text-sm">
        <div>
          Eligible (next batch): <strong>
            {(state.summary?.eligibleMinor || 0) / 100} {state.summary?.currency || "EUR"}
          </strong>
        </div>
        <div>
          Total earned: {(state.summary?.earnedMinor || 0) / 100} {state.summary?.currency || "EUR"}
        </div>
        <div>
          Last paid: {(state.summary?.lastPaidMinor || 0) / 100} {state.summary?.currency || "EUR"}
        </div>
      </div>
    </div>
  );
}
