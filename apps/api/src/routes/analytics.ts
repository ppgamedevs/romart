import { FastifyInstance } from "fastify";

const GA4_ID = process.env.GA4_MEASUREMENT_ID!;
const GA4_SECRET = process.env.GA4_API_SECRET!;
const PH_HOST = process.env.POSTHOG_HOST!;
const PH_KEY = process.env.POSTHOG_KEY!;

async function ga4(eventName: string, params: any, clientId: string) {
  if (!GA4_ID || !GA4_SECRET) return;
  await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${GA4_ID}&api_secret=${GA4_SECRET}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ client_id: clientId, events: [{ name: eventName, params }] }),
  }).catch(()=>{});
}

async function ph(event: string, properties: any, distinctId: string) {
  if (!PH_KEY) return;
  await fetch(`${PH_HOST}/capture/`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ api_key: PH_KEY, event, properties, distinct_id: distinctId }),
  }).catch(()=>{});
}

export default async function routes(app: FastifyInstance) {
  // 1) webhook intern (Stripe) → purchase & aff_conversion_approved
  app.post("/analytics/order-paid", async (req, res) => {
    const b: any = req.body || {};
    const { orderId, userId, currency, subtotalMinor, partnerId, linkId } = b;
    const props = { orderId, currency, value: subtotalMinor/100, partnerId, linkId };
    const cid = userId || orderId;
    await Promise.all([
      ga4("purchase", { transaction_id: orderId, currency, value: subtotalMinor/100 }, cid),
      ph("purchase", props, cid),
      (partnerId || linkId) ? ph("aff_conversion_approved", props, cid) : Promise.resolve()
    ]);
    return res.send({ ok: true });
  });

  // 2) Admin overview (30d) — orders & revenue, afiliere sumară
  app.get("/admin/analytics/overview", async (req, res) => {
    if (req.headers.authorization !== `Bearer ${process.env.ADMIN_TOKEN}`) return res.code(401).send();
    const since = new Date(Date.now() - 30*24*60*60*1000);
    const orders = await app.prisma.order.count({ where: { createdAt: { gte: since } } });
    const revenue = await app.prisma.order.aggregate({
      _sum: { subtotalMinor: true },
      where: { createdAt: { gte: since }, status: { in: ["PAID","FULFILLED"] } }
    });
    const aff = await app.prisma.referralConversion.aggregate({
      _sum: { commissionMinor: true }
    });
    return res.send({
      since, orders30d: orders,
      revenue30dMinor: revenue._sum.subtotalMinor || 0,
      affCommissionMinor: aff._sum.commissionMinor || 0
    });
  });

  // 3) Admin affiliates detail (group by partner/link)
  app.get("/admin/analytics/affiliates", async (req, res) => {
    if (req.headers.authorization !== `Bearer ${process.env.ADMIN_TOKEN}`) return res.code(401).send();
    const since = (req.query as any)?.since ? new Date(String((req.query as any).since)) : new Date(Date.now() - 30*24*60*60*1000);
    const byPartner = await app.prisma.referralConversion.groupBy({
      by: ["partnerId","status","currency"],
      _sum: { subtotalMinor: true, commissionMinor: true },
      _count: { _all: true },
      where: { createdAt: { gte: since } }
    });
    const byLink = await app.prisma.referralConversion.groupBy({
      by: ["linkId","status","currency"],
      _sum: { subtotalMinor: true, commissionMinor: true },
      _count: { _all: true },
      where: { createdAt: { gte: since } }
    });
    return res.send({ since, byPartner, byLink });
  });
}
