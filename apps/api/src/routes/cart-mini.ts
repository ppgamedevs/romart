import { FastifyInstance } from "fastify";

export default async function routes(app: FastifyInstance) {
  // presupunem cookie "cartId" (sau ia-l din sesiunea ta)
  app.get("/cart/mini", async (req, res) => {
    const cartId = (req.cookies as any)?.cartId || (req.headers["x-cart-id"] as string | undefined);
    if (!cartId) return res.send({ items: [], count: 0, totalMinor: 0, currency: "EUR" });

    // TODO: implementează logica reală de cart aici
    // Pentru moment, returnăm un cart gol
    // În implementarea reală, ar trebui să:
    // 1. Găsești cart-ul după cartId
    // 2. Încarci items cu ediții și artwork-uri
    // 3. Calculezi total și count

    return res.send({ items: [], count: 0, totalMinor: 0, currency: "EUR" });
  });
}
