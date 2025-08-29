"use client";
import { usePathname } from "next/navigation";

export default function LocaleSwitcher() {
  const pathname = usePathname(); // ex: /en/artwork/slug
  const locales = (process.env.NEXT_PUBLIC_LOCALES || process.env.LOCALES || "en,ro").split(",");
  
  return (
    <div className="inline-flex gap-1 text-xs">
      {locales.map(l => {
        const parts = pathname.split("/");
        parts[1] = l; // înlocuiește locale-ul
        const href = parts.join("/");
        return (
          <a 
            key={l} 
            href={href} 
            className="px-2 py-1 rounded border hover:bg-gray-100 transition-colors"
          >
            {l.toUpperCase()}
          </a>
        );
      })}
    </div>
  );
}
