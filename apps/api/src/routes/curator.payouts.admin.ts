import { FastifyInstance } from "fastify";
import { prisma } from "@artfromromania/db";
import { stripe } from "../lib/stripe";

function requireAdmin(req: any) { 
  const r = req.user?.role; 
  if (r !== "ADMIN") throw new Error("forbidden"); 
}

function olderThan(date: Date, days: number) {
  const d = new Date(); 
  d.setDate(d.getDate() - days); 
  return date < d;
}

export default async function routes(app: FastifyInstance) {
  // Summary eligibil (preview)
  app.get("/admin/curators/payouts/preview", async (req, res) => {
    requireAdmin(req);
    const grace = parseInt(process.env.CURATOR_PAYOUT_GRACE_DAYS || "14", 10);
    const minMinor = parseInt(process.env.CURATOR_PAYOUT_MIN_MINOR || "5000", 10);
    const currency = process.env.CURATOR_PAYOUT_CURRENCY || "EUR";

    const earned = await prisma.curatorCommission.findMany({
      where: { status: "EARNED", payoutId: null },
      select: { curatorId: true, commissionMinor: true, earnedAt: true }
    });

    const map = new Map<string, number>();
    const nowElig = new Set<string>();
    for (const e of earned) {
      if (!e.earnedAt || !olderThan(e.earnedAt, grace)) continue;
      map.set(e.curatorId, (map.get(e.curatorId) || 0) + e.commissionMinor);
    }
    const items = [];
    for (const [curatorId, sum] of map) {
      if (sum >= minMinor) items.push({ curatorId, amountMinor: sum, currency });
    }
    res.send({ items, totalMinor: items.reduce((s, i) => s + i.amountMinor, 0), count: items.length });
  });

  // Create batch (PENDING)
  app.post("/admin/curators/payouts/create", async (req, res) => {
    requireAdmin(req);
    const { periodFrom, periodTo, label } = (req.body as any) || {};
    const method = (process.env.CURATOR_PAYOUTS_METHOD || "STRIPE_CONNECT") as any;
    const currency = process.env.CURATOR_PAYOUT_CURRENCY || "EUR";
    const grace = parseInt(process.env.CURATOR_PAYOUT_GRACE_DAYS || "14", 10);
    const minMinor = parseInt(process.env.CURATOR_PAYOUT_MIN_MINOR || "5000", 10);

    // Select comisioane eligibile
    const eligible = await prisma.curatorCommission.findMany({
      where: {
        status: "EARNED",
        payoutId: null,
        earnedAt: { lte: new Date(Date.now() - grace * 24 * 60 * 60 * 1000) }
      },
      select: { id: true, curatorId: true, commissionMinor: true }
    });

    const byCurator = new Map<string, { amount: number, ids: string[] }>();
    for (const e of eligible) {
      const x = byCurator.get(e.curatorId) || { amount: 0, ids: [] };
      x.amount += e.commissionMinor; 
      x.ids.push(e.id);
      byCurator.set(e.curatorId, x);
    }

    const items = [];
    let total = 0;
    for (const [curatorId, v] of byCurator) {
      if (v.amount < minMinor) continue;
      total += v.amount;
      items.push({ curatorId, amountMinor: v.amount, currency, commissionIds: v.ids });
    }

    const batch = await prisma.curatorPayoutBatch.create({
      data: {
        label: label || `${process.env.CURATOR_PAYOUT_BATCH_LABEL_PREFIX || "curator-payouts"}-${new Date().toISOString().slice(0, 7)}`,
        currency, 
        method, 
        periodFrom: periodFrom ? new Date(periodFrom) : new Date(0), 
        periodTo: periodTo ? new Date(periodTo) : new Date(),
        totalMinor: total, 
        count: items.length,
        items: { 
          create: items.map(i => ({ 
            curatorId: i.curatorId, 
            amountMinor: i.amountMinor, 
            currency: i.currency 
          })) 
        }
      },
      include: { items: true }
    });

    // leagă comisioanele la payout (dar status rămâne EARNED până la PAID)
    for (const it of items) {
      await prisma.curatorCommission.updateMany({
        where: { id: { in: it.commissionIds } },
        data: { payoutId: batch.items.find(x => x.curatorId === it.curatorId)!.id }
      });
    }

    res.send({ ok: true, batchId: batch.id, count: batch.count, totalMinor: batch.totalMinor });
  });

  // Process batch (STRIPE_CONNECT) sau generează CSV (MANUAL_CSV)
  app.post("/admin/curators/payouts/:batchId/process", async (req, res) => {
    requireAdmin(req);
    const batchId = (req.params as any).batchId as string;
    const batch = await prisma.curatorPayoutBatch.findUnique({
      where: { id: batchId }, 
      include: { items: { include: { curator: true } } }
    });
    if (!batch) return res.code(404).send({ error: "batch-not-found" });
    
    await prisma.curatorPayoutBatch.update({ 
      where: { id: batchId }, 
      data: { status: "PROCESSING", processedAt: new Date() }
    });

    const method = batch.method;
    const results: any[] = [];

    if (method === "STRIPE_CONNECT") {
      for (const it of batch.items) {
        try {
          const acct = it.curator.stripeAccountId;
          if (!acct) throw new Error("no-stripe-account");
          // Transfer din balanța platformei către connected account
          const tr = await stripe.transfers.create({
            amount: it.amountMinor, 
            currency: (batch.currency || "EUR").toLowerCase(),
            destination: acct, 
            description: `Curator payout ${batch.label}`
          });
          await prisma.curatorPayout.update({ 
            where: { id: it.id }, 
            data: { status: "PAID", paidAt: new Date(), transferId: tr.id }
          });
          // marchează comisioanele aferente ca PAID
          await prisma.curatorCommission.updateMany({ 
            where: { payoutId: it.id }, 
            data: { status: "PAID", paidAt: new Date() }
          });
          results.push({ id: it.id, ok: true, transferId: tr.id });
        } catch (e: any) {
          await prisma.curatorPayout.update({ 
            where: { id: it.id }, 
            data: { status: "FAILED", reason: e.message?.slice(0, 200) }
          });
          results.push({ id: it.id, ok: false, error: e.message });
        }
      }
      const allOk = results.every(r => r.ok);
      await prisma.curatorPayoutBatch.update({ 
        where: { id: batchId }, 
        data: { status: allOk ? "PAID" : "PARTIAL" }
      });
      return res.send({ ok: true, results });
    }

    // MANUAL_CSV — generează un CSV simplu pentru plăți offline
    const rows = [["curatorSlug", "displayName", "amountMinor", "currency", "note"]];
    for (const it of batch.items) {
      rows.push([it.curatorId, it.curator.displayName, String(it.amountMinor), batch.currency, batch.label]);
      await prisma.curatorPayout.update({ 
        where: { id: it.id }, 
        data: { status: "PENDING" }
      });
    }
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    await prisma.curatorPayoutBatch.update({ 
      where: { id: batchId }, 
      data: { status: "PENDING" }
    });
    res.header("content-type", "text/csv").send(csv);
  });
}
