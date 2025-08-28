import { FastifyInstance } from "fastify";
import { prisma } from "@artfromromania/db";
import { z } from "zod";

export default async function routes(app: FastifyInstance) {
  app.post("/track", async (req, res) => {
    const S = z.object({
      type: z.enum(["VIEW_ARTWORK", "SAVE_ARTWORK", "SHARE_ARTWORK", "ADD_TO_CART", "CHECKOUT_START", "PURCHASED"]),
      sessionId: z.string().optional(),
      userId: z.string().optional(),
      artistId: z.string().optional(),
      artworkId: z.string().optional(),
      collectionId: z.string().optional(),
      referrer: z.string().nullable().optional(),
      utmSource: z.string().nullable().optional(),
      utmMedium: z.string().nullable().optional(),
      utmCampaign: z.string().nullable().optional(),
      country: z.string().nullable().optional(),
      device: z.string().nullable().optional(),
      priceMinor: z.number().int().nullable().optional(),
    });
    const d = S.parse(req.body || {});
    await prisma.analyticsEvent.create({ 
      data: {
        ...d, 
        userId: req.user?.id || d.userId || null, 
        ts: new Date()
      }
    });
    res.send({ ok: true });
  });
}
