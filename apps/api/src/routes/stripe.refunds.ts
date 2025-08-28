import { FastifyInstance } from "fastify";
import { stripe } from "../lib/stripe";
import { prisma } from "@artfromromania/db";

export default async function routes(app: FastifyInstance) {
  app.post("/webhooks/stripe/refunds", async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;
    let event; 
    try {
      const body = await req.body;
      event = stripe.webhooks.constructEvent(
        JSON.stringify(body), 
        sig, 
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (e: any) { 
      return res.code(400).send(`Webhook Error: ${e.message}`); 
    }

    if (event.type === "charge.refunded" || event.type === "charge.refund.updated") {
      const ch = event.data.object as any;
      const orderId = ch.metadata?.orderId;
      if (!orderId) return res.send({ ok: true });

      const comms = await prisma.curatorCommission.findMany({ where: { orderId } });
      for (const c of comms) {
        if (c.status === "PAID") {
          // înregistrează balanță negativă (deducere la următorul payout)
          await prisma.curatorCommission.create({
            data: {
              ticketId: c.ticketId, 
              curatorId: c.curatorId, 
              orderId: orderId + "-refund",
              basisMinor: -Math.abs(c.basisMinor), 
              pct: c.pct,
              commissionMinor: -Math.abs(c.commissionMinor), 
              status: "EARNED"
            }
          });
        } else {
          await prisma.curatorCommission.update({ 
            where: { id: c.id }, 
            data: { status: "REVERSED" }
          });
        }
      }
    }
    res.send({ ok: true });
  });
}
