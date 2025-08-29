import { FastifyInstance } from "fastify";
import { z } from "zod";

const addToCartSchema = z.object({
  artworkId: z.string(),
  format: z.string(),
  sizeKey: z.string().optional(),
  qty: z.number().min(1).max(99)
});

export default async function routes(app: FastifyInstance) {
  app.post("/public/cart/add", async (req, res) => {
    try {
      const body = addToCartSchema.parse(req.body);
      
      // For now, just return success
      // In a real implementation, you would:
      // 1. Validate the artwork exists and is available
      // 2. Add to user's cart (or create session cart)
      // 3. Return cart item details
      
      res.send({
        success: true,
        message: "Added to cart",
        item: {
          id: `cart_${Date.now()}`,
          artworkId: body.artworkId,
          format: body.format,
          sizeKey: body.sizeKey,
          qty: body.qty
        }
      });
    } catch (error) {
      res.status(400).send({ error: "Invalid request data" });
    }
  });
}
