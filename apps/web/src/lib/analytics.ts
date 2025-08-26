"use client";
import posthog from "posthog-js";

type EventName =
  | "page_view" | "search" | "view_artwork" | "view_artist"
  | "add_to_cart" | "begin_checkout" | "purchase"
  | "aff_visit" | "campaign_code_applied" | "aff_conversion_approved"
  | "ask_curator" | "commission_requested"
  | "artist_share_visit" | "artist_share_conversion";

let enabled = false;

export function initAnalytics() {
  const ga4 = process.env.NEXT_PUBLIC_GA4_ID;
  const phKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const phHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  const consent = document.cookie.includes(`${process.env.CONSENT_ANALYTICS_COOKIE}=true`);

  if (!consent) return;

  if (ga4 && !("gtag" in window)) {
    const s = document.createElement("script");
    s.src = `https://www.googletagmanager.com/gtag/js?id=${ga4}`;
    s.async = true; document.head.appendChild(s);
    // @ts-ignore
    window.dataLayer = window.dataLayer || [];
    // @ts-ignore
    function gtag(){window.dataLayer.push(arguments);}
    // @ts-ignore
    window.gtag = gtag;
    // @ts-ignore
    gtag("js", new Date());
    // @ts-ignore
    gtag("config", ga4, { anonymize_ip: process.env.ANONYMIZE_IP === "true" });
  }

  if (phKey) {
    posthog.init(phKey, {
      api_host: phHost,
      capture_pageview: true,
      loaded: () => { enabled = true; }
      // recordings OFF — le pornim separat cu consent extins dacă vrem
    });
  } else {
    enabled = true;
  }
}

export function track(name: EventName, props: Record<string, any> = {}) {
  if (!enabled) return;
  // @ts-ignore
  if (typeof window !== "undefined" && window.gtag) window.gtag("event", name, props);
  try { posthog.capture(name, props); } catch {}
}

export function setUser(id?: string, props?: Record<string, any>) {
  if (!enabled) return;
  try { if (id) posthog.identify(id, props); else posthog.reset(); } catch {}
  // @ts-ignore
  if (typeof window !== "undefined" && window.gtag && id) window.gtag("set", { user_id: id });
}
