import { FastifyInstance } from "fastify";
import { z } from "zod";
import { quoteOriginal } from "@artfromromania/shipping";

const quoteRequestSchema = z.object({
  items: z.array(z.object({
    orderItemId: z.string(),
    kind: z.enum(["ORIGINAL", "PRINT", "OTHER"]),
    qty: z.number().int().positive(),
    widthCm: z.number().positive(),
    heightCm: z.number().positive(),
    depthCm: z.number().optional(),
    framed: z.boolean().optional(),
    weightKg: z.number().positive().optional(),
    preferred: z.enum(["BOX", "TUBE"]),
    unitAmount: z.number().int().positive()
  })),
  shipTo: z.object({
    country: z.string(),
    postcode: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional()
  }),
  methodPref: z.enum(["STANDARD", "EXPRESS"]).optional()
});

export async function shippingRoutes(fastify: FastifyInstance) {
  // POST /shipping/quote - Get shipping quote for original artworks
  fastify.post("/quote", {
    schema: {
      body: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                orderItemId: { type: "string" },
                kind: { type: "string", enum: ["ORIGINAL", "PRINT", "OTHER"] },
                qty: { type: "number", minimum: 1 },
                widthCm: { type: "number", minimum: 0.1 },
                heightCm: { type: "number", minimum: 0.1 },
                depthCm: { type: "number", minimum: 0 },
                framed: { type: "boolean" },
                weightKg: { type: "number", minimum: 0.1 },
                preferred: { type: "string", enum: ["BOX", "TUBE"] },
                unitAmount: { type: "number", minimum: 1 }
              },
              required: ["orderItemId", "kind", "qty", "widthCm", "heightCm", "preferred", "unitAmount"]
            }
          },
          shipTo: {
            type: "object",
            properties: {
              country: { type: "string" },
              postcode: { type: "string" },
              city: { type: "string" },
              state: { type: "string" }
            },
            required: ["country"]
          },
          methodPref: { type: "string", enum: ["STANDARD", "EXPRESS"] }
        },
        required: ["items", "shipTo"]
      }
    }
  }, async (request, reply) => {
    try {
      const body = quoteRequestSchema.parse(request.body);
      
      const quote = await quoteOriginal(body);
      
      return {
        success: true,
        quote
      };
    } catch (error) {
      fastify.log.error("Shipping quote failed:", error as any);
      
      if (error instanceof Error) {
        return reply.status(400).send({
          success: false,
          error: error.message
        });
      }
      
      return reply.status(500).send({
        success: false,
        error: "Failed to calculate shipping quote"
      });
    }
  });

  // GET /shipping/packages - Get available package configurations
  fastify.get("/packages", async (request, reply) => {
    try {
      const { packagesConfig } = await import("@artfromromania/shipping");
      
      return {
        success: true,
        packages: packagesConfig
      };
    } catch (error) {
      fastify.log.error("Failed to get package config:", error as any);
      return reply.status(500).send({
        success: false,
        error: "Failed to get package configuration"
      });
    }
  });
}
