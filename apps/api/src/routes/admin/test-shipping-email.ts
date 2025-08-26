import { FastifyInstance } from "fastify";
import { enqueueEmail } from "@artfromromania/notifications";

function trackingUrlFor(carrier: "DHL"|"SAMEDAY", code: string) {
  if (carrier === "DHL") return `https://www.dhl.com/global-en/home/tracking.html?tracking-id=${encodeURIComponent(code)}`;
  return `https://www.sameday.ro/awb-tracking?code=${encodeURIComponent(code)}`;
}

export default async function routes(app: FastifyInstance) {
  app.post("/admin/test-shipping-email", async (req, res) => {
    const body = (req.body as any) || {};
    const orderNumber = body.orderNumber ?? "RMA-2025-0010";
    const carrier: "DHL"|"SAMEDAY" = body.carrier ?? "DHL";
    const trackingCode = body.trackingCode ?? "JD014600003RO";
    const trackingUrl = body.trackingUrl ?? trackingUrlFor(carrier, trackingCode);

    const payload = {
      orderNumber,
      status: body.status ?? "IN_TRANSIT",
      carrier,
      trackingCode,
      trackingUrl,
      // labelUrl: "https://signed-url-to-private-label.pdf", // opțional, dacă o ai
      items: [
        { title: "Canvas Print — Golden Field", qty: 1 },
        { title: "Certificate of Authenticity", qty: 1 },
      ],
      destination: {
        name: "Eugen",
        line1: "Str. Exemplu 10",
        city: "București",
        postal: "010000",
        country: "RO",
      },
      eta: body.eta ?? "3–5 business days",
      supportEmail: "curator@artfromromania.com",
    } satisfies import("@artfromromania/email").TemplatePayloads["shipping-status"];

    const to = body.email ?? "you@example.com";

    const out = await enqueueEmail({
      topic: "SHIPPING",
      template: "shipping-status",
      payload,
      email: to,
    });

    return res.send(out);
  });
}
