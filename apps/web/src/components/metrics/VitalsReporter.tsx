"use client";
import { onCLS, onINP, onLCP } from "web-vitals/attribution";

export default function VitalsReporter() {
  function send(metric: any) {
    try {
      navigator.sendBeacon?.("/api/vitals", JSON.stringify(metric)) ||
      fetch("/api/vitals", { method: "POST", body: JSON.stringify(metric), keepalive: true });
    } catch {}
  }
  
  onLCP(send); 
  onINP(send); 
  onCLS(send);
  
  return null;
}
