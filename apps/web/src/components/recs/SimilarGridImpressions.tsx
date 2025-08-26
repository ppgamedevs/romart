"use client";
import { useEffect } from "react";
import { track } from "@/lib/analytics";

/**
 * Trimite evenimente:
 * - rec_impression (o singură dată/section)
 * - rec_click (la click pe oricare item)
 * Poți schimba numele evenimentelor dacă vrei să rămâi strict pe taxonomia existentă.
 */
export default function ImpressionTracker({
  section,
  itemIds,
  hrefs,
}: {
  section: "similar" | "trending" | "for-you" | string;
  itemIds: string[];
  hrefs: string[];
}) {
  useEffect(() => {
    if (!itemIds?.length) return;

    // impresii (simplu: emit o singură dată la mount)
    try {
      track("rec_impression" as any, { section, items: itemIds });
    } catch {}

    // click handler delegat
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a");
      if (!a) return;

      const href = a.getAttribute("href") || "";
      const idx = hrefs.indexOf(href);
      if (idx >= 0) {
        const id = itemIds[idx];
        try {
          track("rec_click" as any, { section, artworkId: id, href });
        } catch {}
      }
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, JSON.stringify(itemIds)]);

  return null;
}
