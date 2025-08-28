import { prisma } from "./index";

export async function seedCosting() {
  // Seed print base costs
  const costs = [
    {
      kind: "CANVAS",
      sizeLabel: "30x40",
      baseMinor: 2000,
      packagingMinor: 200,
      leadDays: 5,
      active: true
    },
    {
      kind: "CANVAS",
      sizeLabel: "50x70",
      baseMinor: 4500,
      packagingMinor: 300,
      leadDays: 7,
      active: true
    },
    {
      kind: "METAL",
      sizeLabel: "30x40",
      baseMinor: 3500,
      packagingMinor: 250,
      leadDays: 8,
      active: true
    },
    {
      kind: "METAL",
      sizeLabel: "50x70",
      baseMinor: 6500,
      packagingMinor: 400,
      leadDays: 10,
      active: true
    },
    {
      kind: "PHOTO",
      sizeLabel: "30x40",
      baseMinor: 1500,
      packagingMinor: 150,
      leadDays: 3,
      active: true
    },
    {
      kind: "PHOTO",
      sizeLabel: "50x70",
      baseMinor: 2800,
      packagingMinor: 200,
      leadDays: 5,
      active: true
    }
  ];

  for (const cost of costs) {
    await prisma.printBaseCost.upsert({
      where: { kind_sizeLabel: { kind: cost.kind, sizeLabel: cost.sizeLabel } },
      create: cost,
      update: cost
    });
  }

  // Seed artist pricing profiles (example)
  const profiles = [
    {
      artistId: "artist1",
      printMarkupPct: 0.65,
      canvasMarkupPct: 0.70,
      metalMarkupPct: 0.75,
      photoMarkupPct: 0.60,
      minMarginPct: 0.40,
      rounding: "END_99",
      active: true
    },
    {
      artistId: "artist2",
      printMarkupPct: 0.55,
      minMarginPct: 0.35,
      rounding: "END_00",
      active: true
    }
  ];

  for (const profile of profiles) {
    await prisma.artistPricingProfile.upsert({
      where: { artistId: profile.artistId },
      create: profile,
      update: profile
    });
  }

  // Seed example campaigns
  const campaigns = [
    {
      name: "Summer Sale - Digital Art",
      scope: "MEDIUM",
      medium: "DIGITAL",
      pct: -0.15,
      priority: 10,
      stackable: false,
      maxDiscountMinor: 5000,
      startsAt: new Date("2024-06-01T00:00:00Z"),
      endsAt: new Date("2024-08-31T23:59:59Z"),
      active: true,
      ogBadge: true
    },
    {
      name: "Canvas Prints Promotion",
      scope: "EDITION_KIND",
      editionKind: "CANVAS",
      pct: -0.10,
      priority: 20,
      stackable: false,
      startsAt: new Date("2024-01-01T00:00:00Z"),
      endsAt: new Date("2024-12-31T23:59:59Z"),
      active: true,
      ogBadge: true
    },
    {
      name: "Current Test Campaign",
      scope: "GLOBAL",
      pct: -0.20,
      priority: 5,
      stackable: false,
      startsAt: new Date("2025-01-01T00:00:00Z"),
      endsAt: new Date("2025-12-31T23:59:59Z"),
      active: true,
      ogBadge: true
    }
  ];

  for (const campaign of campaigns) {
    // Check if campaign already exists by name
    const existing = await prisma.campaign.findFirst({
      where: { name: campaign.name }
    });
    
    if (existing) {
      await prisma.campaign.update({
        where: { id: existing.id },
        data: campaign
      });
    } else {
      await prisma.campaign.create({
        data: campaign
      });
    }
  }
}

// Run standalone if called directly
if (require.main === module) {
  seedCosting().then(() => process.exit(0));
}
