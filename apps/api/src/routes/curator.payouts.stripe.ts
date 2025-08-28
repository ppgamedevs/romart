import { FastifyInstance } from "fastify";
import { prisma } from "@artfromromania/db";
import { stripe } from "../lib/stripe";

function requireRole(req: any, roles: string[]) { 
  const r = req.user?.role; 
  if (!r || !roles.includes(r)) throw new Error("forbidden"); 
}

export default async function routes(app: FastifyInstance) {
  // Curator: create/connect Stripe Express account + onboarding link
  app.post("/studio/curator/stripe/onboarding", async (req, res) => {
    requireRole(req, ["CURATOR", "ADMIN"]);
    const userId = req.user!.id;
    let profile = await prisma.curatorProfile.findUnique({ where: { userId } });
    if (!profile) return res.code(404).send({ error: "no-curator-profile" });

    if (!profile.stripeAccountId) {
      const acct = await stripe.accounts.create({
        country: "RO", 
        type: "express",
        business_type: "individual",
        email: req.user!.email, 
        capabilities: { transfers: { requested: true } },
      });
      profile = await prisma.curatorProfile.update({
        where: { id: profile.id },
        data: { stripeAccountId: acct.id, payoutMethod: "STRIPE_CONNECT" }
      });
    }

    const link = await stripe.accountLinks.create({
      account: profile.stripeAccountId!,
      refresh_url: `${process.env.SITE_URL}/studio/payouts?refresh=1`,
      return_url: `${process.env.SITE_URL}/studio/payouts?done=1`,
      type: "account_onboarding",
    });
    res.send({ url: link.url });
  });

  // Webhook (payouts_enabled / restrictions)
  app.post("/webhooks/stripe", async (req, res) => {
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
      app.log.error(e);
      return res.code(400).send(`Webhook Error: ${e.message}`);
    }

    if (event.type === "account.updated") {
      const acct = event.data.object as any;
      await prisma.curatorProfile.updateMany({
        where: { stripeAccountId: acct.id },
        data: { payoutsEnabled: !!acct.payouts_enabled }
      });
    }

    // optional: charge.refunded -> clawback comision (vezi secțiunea refund)
    res.send({ received: true });
  });
}
