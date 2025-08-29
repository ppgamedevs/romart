import { FastifyInstance } from "fastify";
import { prisma } from "@artfromromania/db";

export default async function routes(app: FastifyInstance) {
  app.get("/public/price/quote", async (req, res) => {
    const q = req.query as any;
    const artworkId = String(q.artworkId || "");
    const format = String(q.format || "ORIGINAL");
    const sizeKey = String(q.sizeKey || "");
    const qty = parseInt(String(q.qty || "1"), 10);

    if (!artworkId) {
      return res.status(400).send({ error: "artworkId required" });
    }

    // Fetch artwork
    const artwork = await prisma.artwork.findUnique({
      where: { id: artworkId },
      include: {
        editions: {
          where: { active: true },
          select: { id: true, priceMinor: true }
        }
      }
    });

    if (!artwork) {
      return res.status(404).send({ error: "artwork not found" });
    }

    // Simple pricing logic
    let basePriceMinor = artwork.priceMinor || 0;
    
    // Format adjustments
    if (format === "CANVAS") {
      basePriceMinor = Math.round(basePriceMinor * 0.3); // 30% of original
    } else if (format === "METAL") {
      basePriceMinor = Math.round(basePriceMinor * 0.4); // 40% of original
    } else if (format === "PHOTO") {
      basePriceMinor = Math.round(basePriceMinor * 0.2); // 20% of original
    }

    // Size adjustments
    if (sizeKey === "M") {
      basePriceMinor = Math.round(basePriceMinor * 1.2); // 20% more for medium
    } else if (sizeKey === "L") {
      basePriceMinor = Math.round(basePriceMinor * 1.5); // 50% more for large
    }

    // Check availability
    const isOriginalSold = artwork.status === "SOLD";
    const hasEditions = artwork.editions.length > 0;
    
    if (format === "ORIGINAL" && isOriginalSold) {
      return res.status(400).send({ error: "original sold out" });
    }

    if (format !== "ORIGINAL" && !hasEditions) {
      return res.status(400).send({ error: "no editions available" });
    }

    // Calculate totals
    const netMinor = basePriceMinor;
    const taxMinor = Math.round(netMinor * 0.19); // 19% VAT
    const grossMinor = netMinor + taxMinor;

    res.send({
      currency: artwork.currency || "EUR",
      unit: {
        netMinor,
        grossMinor
      },
      taxMinor,
      qty,
      total: {
        netMinor: netMinor * qty,
        grossMinor: grossMinor * qty,
        taxMinor: taxMinor * qty
      }
    });
  });
}
