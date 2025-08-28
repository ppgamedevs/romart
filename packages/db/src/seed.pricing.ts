import { prisma } from "./index";

export async function seedPricing() {
  await prisma.priceRule.createMany({
    data: [
      {
        name: "Summer Painting -10%",
        scope: "MEDIUM",
        medium: "PAINTING",
        pct: -0.10,
        priority: 10,
        stackable: false,
        active: false
      },
      {
        name: "Digital Spotlight -15%",
        scope: "DIGITAL",
        pct: -0.15,
        priority: 20,
        stackable: false,
        active: false
      }
    ]
  });
}

// Run standalone if called directly
if (require.main === module) {
  seedPricing().then(() => process.exit(0));
}
