import { prisma } from "@artfromromania/db";

function inWindow(now: Date, s: Date, e: Date) { return now >= s && now <= e; }

export async function loadActiveCampaigns(args: {
  now: Date,
  medium: string,
  artworkId: string,
  editionKind?: string | null,
  artistId?: string | null,
}) {
  const rows = await prisma.campaign.findMany({
    where: { active: true },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }]
  });

  return rows.filter(r => {
    if (!inWindow(args.now, r.startsAt, r.endsAt)) return false;
    if (r.scope === "GLOBAL") return true;
    if (r.scope === "MEDIUM") return r.medium === args.medium;
    if (r.scope === "ARTIST") return !!args.artistId && r.artistId === args.artistId;
    if (r.scope === "ARTWORK") return r.artworkId === args.artworkId;
    if (r.scope === "EDITION_KIND") return (!!args.editionKind && r.editionKind === args.editionKind);
    return false;
  });
}

export function applyCampaigns(baseMinor: number, campaigns: any[]) {
  const maxStacks = Math.max(0, parseInt(process.env.PROMO_MAX_STACKS || "1", 10));
  let running = baseMinor;
  const applied: { id: string; name: string; deltaMinor: number; source: "CAMPAIGN" }[] = [];
  let stacks = 0;

  for (const c of campaigns) {
    if (maxStacks === 0 && applied.length > 0) break;
    const deltaPct = c.pct ? Math.round(running * c.pct) : 0;
    const deltaAdd = c.addMinor ?? 0;
    let delta = deltaPct + deltaAdd;

    if (c.maxDiscountMinor != null && delta < 0) {
      // nu depășim cap-ul în minor
      delta = Math.max(delta, -Math.abs(c.maxDiscountMinor));
    }
    if (!delta) continue;

    running = running + delta;
    applied.push({ id: c.id, name: c.name, deltaMinor: delta, source: "CAMPAIGN" });
    stacks += c.stackable ? 1 : maxStacks;   // dacă nu e stackable, închidem loop
    if (!c.stackable || stacks >= maxStacks) break;
  }
  return { running, applied };
}
