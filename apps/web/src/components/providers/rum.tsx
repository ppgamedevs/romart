"use client";

export function reportWebVitals(metric: any) {
  if (process.env.NEXT_PUBLIC_RUM_PROVIDER !== "INTERNAL") return;
  
  const sampleRate = Number(process.env.NEXT_PUBLIC_RUM_SAMPLE_RATE || "0.1");
  if (Math.random() > sampleRate) return;

  const data = {
    t: metric.name,
    v: metric.value,
    route: (window as any).__next_route__,
    url: location.pathname,
    d: navigator.userAgent.includes("Mobile") ? "mobile" : "desktop"
  };

  // Use sendBeacon for non-blocking requests
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/rum", JSON.stringify(data));
  } else {
    // Fallback to fetch
    fetch("/api/rum", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).catch(() => {
      // Silently fail
    });
  }
}
