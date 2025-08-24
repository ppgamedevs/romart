import { FastifyInstance } from "fastify";
import { prisma } from "@artfromromania/db";
import { getInvoiceDownloadUrl } from "../invoices/storage";

export async function invoiceRoutes(fastify: FastifyInstance) {
  // GET /invoices/:orderId/download
  fastify.get("/:orderId/download", {
    preHandler: async (request, reply) => {
      // Rate limiting - simplified for now
      // In a full implementation, you would use the rate limiter from auth package

      // Authentication check
      if (!request.user) {
        return reply.status(401).send({ error: "Unauthorized" });
      }
    }
  }, async (request, reply) => {
    const { orderId } = request.params as { orderId: string };
    const user = request.user!;

    try {
      // Find order and verify ownership
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          invoice: true,
          buyer: true
        }
      });

      if (!order) {
        return reply.status(404).send({ error: "Order not found" });
      }

      // Check ownership (buyer or admin)
      if (order.buyerId !== user.id && user.role !== "ADMIN") {
        return reply.status(403).send({ error: "Access denied" });
      }

      // Check if invoice exists
      if (!order.invoice) {
        return reply.status(404).send({ error: "Invoice not found" });
      }

      // Check if PDF is available
      if (!order.invoice.pdfStorageKey) {
        return reply.status(404).send({ error: "Invoice PDF not available" });
      }

      // Generate signed download URL
      const downloadUrl = await getInvoiceDownloadUrl(order.invoice.pdfStorageKey);

      return {
        downloadUrl,
        expiresIn: 3600, // 1 hour
        invoiceNumber: order.invoice.number
      };
    } catch (error) {
      fastify.log.error("Invoice download error:", error as any);
      return reply.status(500).send({ error: "Failed to generate download URL" });
    }
  });
}
