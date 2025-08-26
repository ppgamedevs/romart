import { FastifyInstance } from "fastify";
import { enqueueEmail } from "@artfromromania/notifications";

export default async function routes(app: FastifyInstance) {
  app.post("/admin/test-email", async (req, res) => {
    // EXEMPLE minimal — înlocuiește cu un user/email real
    const email = (req.body as any)?.email || "you@example.com";
    const payload = {
      orderNumber: "RMA-2025-0001",
      customerName: "Eugen",
      currency: "EUR",
      totalMinor: 25900,
      orderUrl: "https://artfromromania.com/account/orders/RMA-2025-0001",
      supportEmail: "curator@artfromromania.com",
      items: [
        { title: "Oil on Canvas — Golden Field", qty: 1, amountMinor: 25900, currency: "EUR" },
      ],
    } satisfies import("@artfromromania/email").TemplatePayloads["order-confirmed"];

    const result = await enqueueEmail({
      topic: "ORDER",
      template: "order-confirmed",
      payload,
      email,           // sau userId
    });

    return res.send(result);
  });
}
