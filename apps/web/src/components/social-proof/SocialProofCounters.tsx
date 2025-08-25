"use client";

import { useLocale } from "next-intl";

interface SocialProofCountersProps {
  favoritesCount: number | null;
  views24h: number | null;
  soldCount: number;
  countriesCount: number;
  className?: string;
}

export function SocialProofCounters({
  favoritesCount,
  views24h,
  soldCount,
  countriesCount,
  className = "",
}: SocialProofCountersProps) {
  const locale = useLocale();

  const counters = [];

  if (favoritesCount !== null) {
    counters.push({
      icon: "❤️",
      text: locale === "ro" 
        ? `${favoritesCount} colecționari au salvat`
        : `${favoritesCount} collectors saved`,
    });
  }

  if (views24h !== null) {
    counters.push({
      icon: "👀",
      text: locale === "ro"
        ? `${views24h} vizualizări în ultimele 24h`
        : `${views24h} views in last 24h`,
    });
  }

  if (soldCount > 0) {
    counters.push({
      icon: "🎨",
      text: locale === "ro"
        ? `${soldCount} vândut`
        : `${soldCount} sold`,
    });
  }

  if (countriesCount > 0) {
    counters.push({
      icon: "🌍",
      text: locale === "ro"
        ? `Vândut în ${countriesCount} țări`
        : `Sold in ${countriesCount} countries`,
    });
  }

  if (counters.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {counters.map((counter, index) => (
        <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
          <span>{counter.icon}</span>
          <span>{counter.text}</span>
        </div>
      ))}
    </div>
  );
}
