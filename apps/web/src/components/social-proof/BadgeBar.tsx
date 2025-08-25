"use client";

import { Badge } from "@/components/ui/badge";
import { CuratorBadgeKind } from "@artfromromania/db";
import { useLocale } from "next-intl";

interface BadgeBarProps {
  badges: Array<{
    kind: CuratorBadgeKind;
    notes?: string | null;
  }>;
  className?: string;
}

const badgeConfig = {
  [CuratorBadgeKind.CURATOR_PICK]: {
    label: { en: "Curator's Pick", ro: "Alegerea Curatorului" },
    variant: "default" as const,
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  [CuratorBadgeKind.NEW_ARRIVAL]: {
    label: { en: "New Arrival", ro: "Nou Sosit" },
    variant: "secondary" as const,
    className: "bg-green-100 text-green-800 border-green-200",
  },
  [CuratorBadgeKind.TRENDING]: {
    label: { en: "Trending", ro: "Tendință" },
    variant: "destructive" as const,
    className: "bg-red-100 text-red-800 border-red-200",
  },
  [CuratorBadgeKind.LIMITED_LEFT]: {
    label: { en: "Limited Left", ro: "Stoc Limitat" },
    variant: "outline" as const,
    className: "bg-orange-100 text-orange-800 border-orange-200",
  },
  [CuratorBadgeKind.EDITION_SOLD_OUT]: {
    label: { en: "Sold Out", ro: "Epuiat" },
    variant: "secondary" as const,
    className: "bg-gray-100 text-gray-800 border-gray-200",
  },
  [CuratorBadgeKind.SHIPS_FROM_RO]: {
    label: { en: "Ships from Romania", ro: "Se livrează din România" },
    variant: "outline" as const,
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  [CuratorBadgeKind.FEATURED]: {
    label: { en: "Featured", ro: "Recomandat" },
    variant: "default" as const,
    className: "bg-purple-100 text-purple-800 border-purple-200",
  },
};

// Priority order for badges
const badgePriority = [
  CuratorBadgeKind.CURATOR_PICK,
  CuratorBadgeKind.TRENDING,
  CuratorBadgeKind.LIMITED_LEFT,
  CuratorBadgeKind.NEW_ARRIVAL,
  CuratorBadgeKind.SHIPS_FROM_RO,
  CuratorBadgeKind.EDITION_SOLD_OUT,
  CuratorBadgeKind.FEATURED,
];

export function BadgeBar({ badges, className = "" }: BadgeBarProps) {
  const locale = useLocale();

  if (!badges || badges.length === 0) {
    return null;
  }

  // Sort badges by priority and take only the first 2 for display
  const sortedBadges = badges
    .sort((a, b) => {
      const aIndex = badgePriority.indexOf(a.kind);
      const bIndex = badgePriority.indexOf(b.kind);
      return aIndex - bIndex;
    })
    .slice(0, 2);

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {sortedBadges.map((badge, index) => {
        const config = badgeConfig[badge.kind];
        if (!config) return null;

        return (
          <Badge
            key={`${badge.kind}-${index}`}
            variant={config.variant}
            className={config.className}
          >
            {config.label[locale as keyof typeof config.label] || config.label.en}
          </Badge>
        );
      })}
    </div>
  );
}
