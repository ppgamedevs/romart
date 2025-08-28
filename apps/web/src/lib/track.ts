export type TrackPayload = {
  type: "VIEW_ARTWORK" | "SAVE_ARTWORK" | "SHARE_ARTWORK" | "ADD_TO_CART" | "CHECKOUT_START" | "PURCHASED";
  artworkId?: string; 
  artistId?: string; 
  collectionId?: string;
  priceMinor?: number;
};

export async function trackEvent(p: TrackPayload) {
  try {
    const body = {
      ...p,
      sessionId: getSessionId(),
      referrer: typeof document !== "undefined" ? document.referrer : undefined,
      utmSource: getParam("utm_source"), 
      utmMedium: getParam("utm_medium"), 
      utmCampaign: getParam("utm_campaign"),
      country: (Intl.DateTimeFormat().resolvedOptions().timeZone || "").includes("Europe/Bucharest") ? "RO" : undefined, // simplificat; poți folosi un georesolver
      device: typeof navigator !== "undefined" && /Mobi/i.test(navigator.userAgent) ? "mobile" : "desktop"
    };
    await fetch("/api/track", { 
      method: "POST", 
      headers: { "content-type": "application/json" }, 
      body: JSON.stringify(body) 
    });
  } catch {}
}

function getSessionId() { 
  const k = "romart.sid"; 
  let v = localStorage.getItem(k); 
  if (!v) { 
    v = crypto.randomUUID(); 
    localStorage.setItem(k, v); 
  } 
  return v; 
}

function getParam(n: string) { 
  if (typeof window === "undefined") return null; 
  const u = new URL(window.location.href); 
  return u.searchParams.get(n); 
}
