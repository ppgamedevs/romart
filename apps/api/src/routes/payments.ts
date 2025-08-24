import { FastifyInstance } from "fastify";
import { createPaymentIntent, cancelPaymentIntent } from "../payments/stripe";
import { z } from "zod";

const createIntentSchema = z.object({
  cartId: z.string(),
  email: z.string().email().optional(),
  shippingAddress: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    region: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string()
  }).optional(),
  billingAddress: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    region: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string()
  }).optional()
});

export async function paymentRoutes(fastify: FastifyInstance) {
  // Create payment intent
  fastify.post("/payments/create-intent", async (request, reply) => {
    try {
      // Simple auth check (in production, use proper auth)
      const authHeader = request.headers.authorization;
      if (authHeader !== `Bearer ${process.env.API_SECRET_KEY || "dev-secret"}`) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const payload = createIntentSchema.parse(request.body);
      
      const result = await createPaymentIntent(payload);
      
      return result;
    } catch (error) {
      console.error("Create payment intent error:", error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          error: "Invalid request data", 
          details: error.errors 
        });
      }
      
      if (error instanceof Error && error.message.includes("original_reserved")) {
        return reply.status(409).send({ 
          error: "original_reserved",
          message: "One or more original artworks are currently reserved"
        });
      }
      
      if (error instanceof Error && error.message.includes("out_of_stock")) {
        return reply.status(409).send({ 
          error: "out_of_stock",
          message: "One or more items are out of stock"
        });
      }
      
      return reply.status(500).send({ error: "Failed to create payment intent" });
    }
  });

  // Cancel payment intent
  fastify.post("/payments/cancel-intent", async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      if (authHeader !== `Bearer ${process.env.API_SECRET_KEY || "dev-secret"}`) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const { orderId } = request.body as { orderId: string };
      
      if (!orderId) {
        return reply.status(400).send({ error: "orderId is required" });
      }
      
      await cancelPaymentIntent(orderId);
      
      return { success: true };
    } catch (error) {
      console.error("Cancel payment intent error:", error);
      return reply.status(500).send({ error: "Failed to cancel payment intent" });
    }
  });
}
