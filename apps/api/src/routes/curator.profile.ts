import { FastifyInstance } from "fastify";
import { prisma } from "@artfromromania/db";

export default async function routes(app: FastifyInstance) {
  app.get("/public/me/curator-profile", async (req, res) => {
    if (!req.user) return res.code(401).send({});
    const p = await prisma.curatorProfile.findUnique({ 
      where: { userId: req.user.id }, 
      select: { payoutMethod: true, payoutsEnabled: true }
    });
    res.send(p || {});
  });

  app.get("/curation/me/summary", async (req, res) => {
    if (!req.user) return res.code(401).send({});
    const currency = process.env.CURATOR_PAYOUT_CURRENCY || "EUR";
    const curator = await prisma.curatorProfile.findUnique({ 
      where: { userId: req.user.id }, 
      select: { id: true }
    });
    
    if (!curator) return res.code(404).send({ error: "no-curator-profile" });

    const earned = await prisma.curatorCommission.aggregate({ 
      _sum: { commissionMinor: true }, 
      where: { curatorId: curator.id }
    });
    
    const paid = await prisma.curatorCommission.aggregate({ 
      _sum: { commissionMinor: true }, 
      where: { 
        curatorId: curator.id, 
        status: "PAID" 
      }
    });
    
    res.send({ 
      currency, 
      earnedMinor: earned._sum.commissionMinor || 0, 
      lastPaidMinor: paid._sum.commissionMinor || 0, 
      eligibleMinor: 0 // optional calc detaliat 
    });
  });
}
