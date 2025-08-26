"use client";
import { useEffect } from "react";
import { initAnalytics, track } from "@/lib/analytics";
import { usePathname, useSearchParams } from "next/navigation";

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const qs = useSearchParams();

  useEffect(() => { initAnalytics(); }, []);
  useEffect(() => {
    track("page_view", { path, search: qs?.toString() || "" });
  }, [path, qs]);

  return <>{children}</>;
}
