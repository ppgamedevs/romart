import { FastifyInstance } from "fastify";
import { z } from "zod";
import { quoteOriginal } from "@artfromromania/shipping";
import { prisma } from "@artfromromania/db";
import { createPresignedUploadUrl, getSignedDownloadUrl } from "@artfromromania/storage";
import { logAudit } from "../moderation/service";

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

  // POST /shipping/:shipmentId/manual-label/presign - Get presigned URL for label upload
  fastify.post("/:shipmentId/manual-label/presign", async (request, reply) => {
    try {
      const { shipmentId } = request.params as { shipmentId: string };
      
      // Validate shipment exists and is ready for label
      const shipment = await prisma.shipment.findUnique({
        where: { id: shipmentId },
        include: { order: true }
      });
      
      if (!shipment) {
        return reply.status(404).send({
          success: false,
          error: "Shipment not found"
        });
      }
      
      if (shipment.status !== "READY_TO_SHIP") {
        return reply.status(400).send({
          success: false,
          error: "Shipment is not ready for label upload"
        });
      }
      
      // Generate presigned URL for PDF upload
      const key = `labels/${shipmentId}/${Date.now()}.pdf`;
      const presignedUrl = await createPresignedUploadUrl({
        key,
        contentType: "application/pdf",
        maxSizeBytes: 5 * 1024 * 1024 // 5MB max
      });
      
      return {
        success: true,
        uploadUrl: presignedUrl.url,
        key,
        expiresAt: presignedUrl.expiresAt
      };
    } catch (error) {
      fastify.log.error("Label presign failed:", error as any);
      return reply.status(500).send({
        success: false,
        error: "Failed to generate upload URL"
      });
    }
  });

  // POST /shipping/:shipmentId/manual-label/finalize - Finalize label upload and set tracking
  fastify.post("/:shipmentId/manual-label/finalize", async (request, reply) => {
    try {
      const { shipmentId } = request.params as { shipmentId: string };
      const body = z.object({
        key: z.string(),
        trackingCode: z.string(),
        carrier: z.enum(["SAMEDAY", "DHL"]).optional()
      }).parse(request.body);
      
      // Get shipment with order details
      const shipment = await prisma.shipment.findUnique({
        where: { id: shipmentId },
        include: { 
          order: {
            include: {
              shippingAddress: true
            }
          }
        }
      });
      
      if (!shipment) {
        return reply.status(404).send({
          success: false,
          error: "Shipment not found"
        });
      }
      
      if (shipment.status !== "READY_TO_SHIP") {
        return reply.status(400).send({
          success: false,
          error: "Shipment is not ready for label finalization"
        });
      }
      
      // Determine carrier based on destination
      const isDomestic = shipment.order.shippingAddress?.country === "RO";
      const allowedCarrier = isDomestic 
        ? process.env.SHIP_CARRIER_DOMESTIC 
        : process.env.SHIP_CARRIER_INTL;
      
      if (body.carrier && body.carrier !== allowedCarrier) {
        return reply.status(400).send({
          success: false,
          error: "carrier_not_allowed",
          message: `Use ${allowedCarrier} for this destination.`
        });
      }
      
      const carrier = allowedCarrier as "SAMEDAY" | "DHL";
      
      // Update shipment with label and tracking info
      await prisma.shipment.update({
        where: { id: shipmentId },
        data: {
          labelStorageKey: body.key,
          trackingNumbers: [{ carrier, code: body.trackingCode }],
          serviceName: isDomestic ? "Sameday Domestic" : "DHL International",
          status: "LABEL_PURCHASED"
        }
      });
      
      // Log audit action
      await logAudit({
        actorId: "system", // TODO: get actual user ID from auth
        action: "LABEL_UPLOADED",
        entityType: "SHIPMENT",
        entityId: shipmentId,
        data: {
          carrier,
          trackingCode: body.trackingCode,
          labelKey: body.key
        }
      });
      
      return {
        success: true,
        message: "Label uploaded successfully"
      };
    } catch (error) {
      fastify.log.error("Label finalize failed:", error as any);
      return reply.status(500).send({
        success: false,
        error: "Failed to finalize label upload"
      });
    }
  });

  // POST /shipping/:shipmentId/mark-in-transit - Mark shipment as in transit
  fastify.post("/:shipmentId/mark-in-transit", async (request, reply) => {
    try {
      const { shipmentId } = request.params as { shipmentId: string };
      
      const shipment = await prisma.shipment.findUnique({
        where: { id: shipmentId }
      });
      
      if (!shipment) {
        return reply.status(404).send({
          success: false,
          error: "Shipment not found"
        });
      }
      
      if (shipment.status === "IN_TRANSIT") {
        return {
          success: true,
          message: "Shipment already marked as in transit"
        };
      }
      
      await prisma.shipment.update({
        where: { id: shipmentId },
        data: {
          status: "IN_TRANSIT",
          handedOverAt: new Date()
        }
      });
      
      return {
        success: true,
        message: "Shipment marked as in transit"
      };
    } catch (error) {
      fastify.log.error("Mark in transit failed:", error as any);
      return reply.status(500).send({
        success: false,
        error: "Failed to mark shipment as in transit"
      });
    }
  });

  // POST /shipping/:shipmentId/mark-delivered - Mark shipment as delivered
  fastify.post("/:shipmentId/mark-delivered", async (request, reply) => {
    try {
      const { shipmentId } = request.params as { shipmentId: string };
      
      const shipment = await prisma.shipment.findUnique({
        where: { id: shipmentId }
      });
      
      if (!shipment) {
        return reply.status(404).send({
          success: false,
          error: "Shipment not found"
        });
      }
      
      if (shipment.status === "DELIVERED") {
        return {
          success: true,
          message: "Shipment already marked as delivered"
        };
      }
      
      await prisma.shipment.update({
        where: { id: shipmentId },
        data: {
          status: "DELIVERED",
          deliveredAt: new Date()
        }
      });
      
      return {
        success: true,
        message: "Shipment marked as delivered"
      };
    } catch (error) {
      fastify.log.error("Mark delivered failed:", error as any);
      return reply.status(500).send({
        success: false,
        error: "Failed to mark shipment as delivered"
      });
    }
  });

  // GET /shipping/:shipmentId/label - Get signed download URL for label
  fastify.get("/:shipmentId/label", async (request, reply) => {
    try {
      const { shipmentId } = request.params as { shipmentId: string };
      
      const shipment = await prisma.shipment.findUnique({
        where: { id: shipmentId }
      });
      
      if (!shipment) {
        return reply.status(404).send({
          success: false,
          error: "Shipment not found"
        });
      }
      
      if (!shipment.labelStorageKey) {
        return reply.status(404).send({
          success: false,
          error: "Label not found"
        });
      }
      
      const downloadUrl = await getSignedDownloadUrl({
        key: shipment.labelStorageKey,
        expiresIn: 3600 // 1 hour
      });
      
      return {
        success: true,
        downloadUrl
      };
    } catch (error) {
      fastify.log.error("Label download failed:", error as any);
      return reply.status(500).send({
        success: false,
        error: "Failed to generate download URL"
      });
    }
  });
}
