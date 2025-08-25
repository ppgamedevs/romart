import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@artfromromania/db";
import { stripe } from "../payments/stripe";
import { createSignedDownloadUrl } from "@artfromromania/storage";
import { logAudit } from "../moderation/service";
import { stringify } from "csv-stringify/sync";
import { format } from "date-fns";

// Admin authentication middleware
async function requireAdmin(request: any, reply: any) {
  // TODO: Implement proper admin authentication
  // For now, we'll use a simple check
  const isAdmin = request.headers["x-admin-token"] === "admin-secret";
  if (!isAdmin) {
    return reply.status(403).send({ error: "Admin access required" });
  }
}

export async function adminRoutes(fastify: FastifyInstance) {
  // Apply admin middleware to all routes
  fastify.addHook("preHandler", requireAdmin);

  // GET /admin/orders - List orders with filters
  fastify.get("/orders", async (request, reply) => {
    try {
      const { q, status, from, to, page = 1, limit = 20 } = request.query as any;
      
      const where: any = {};
      
      if (q) {
        where.OR = [
          { id: { contains: q, mode: "insensitive" } },
          { buyer: { email: { contains: q, mode: "insensitive" } } },
          { buyer: { name: { contains: q, mode: "insensitive" } } }
        ];
      }
      
      if (status) {
        where.status = status;
      }
      
      if (from || to) {
        where.createdAt = {};
        if (from) where.createdAt.gte = new Date(from);
        if (to) where.createdAt.lte = new Date(to);
      }
      
      const skip = (page - 1) * limit;
      
      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            buyer: true,
            items: {
              include: {
                artwork: true,
                edition: true,
                artist: true
              }
            },
            shipments: true,
            refunds: true,
            returns: true
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit
        }),
        prisma.order.count({ where })
      ]);
      
      return {
        success: true,
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      fastify.log.error("Admin orders fetch failed:", error as any);
      return reply.status(500).send({
        success: false,
        error: "Failed to fetch orders"
      });
    }
  });

  // GET /admin/orders/:id - Get order details
  fastify.get("/orders/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          buyer: true,
          items: {
            include: {
              artwork: true,
              edition: true,
              artist: true
            }
          },
          shipments: {
            include: {
              packages: true
            }
          },
          invoice: true,
          refunds: true,
          returns: {
            include: {
              items: true
            }
          },
          creditNotes: true,
          // Note: AdminNote is a separate entity, not directly related to Order
        }
      });
      
      if (!order) {
        return reply.status(404).send({
          success: false,
          error: "Order not found"
        });
      }
      
      // Get audit log entries
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          entityType: "ORDER",
          entityId: id
        },
        include: {
          actor: true
        },
        orderBy: { createdAt: "desc" },
        take: 50
      });
      
      return {
        success: true,
        order: {
          ...order,
          auditLogs
        }
      };
    } catch (error) {
      fastify.log.error("Admin order fetch failed:", error as any);
      return reply.status(500).send({
        success: false,
        error: "Failed to fetch order"
      });
    }
  });

  // POST /admin/orders/:id/refund - Process refund
  fastify.post("/orders/:id/refund", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = z.object({
        amount: z.number().positive(),
        reason: z.string().optional(),
        items: z.array(z.object({
          orderItemId: z.string(),
          qty: z.number().int().positive()
        })).optional()
      }).parse(request.body);
      
      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          items: true
        }
      });
      
      if (!order) {
        return reply.status(404).send({
          success: false,
          error: "Order not found"
        });
      }
      
      if (order.status !== "PAID") {
        return reply.status(400).send({
          success: false,
          error: "Order must be paid to process refund"
        });
      }
      
      // Create Stripe refund
      if (!stripe) {
        return reply.status(500).send({
          success: false,
          error: "Stripe not configured"
        });
      }
      
      const refund = await stripe.refunds.create({
        payment_intent: order.providerIntentId!,
        amount: body.amount,
        reason: body.reason ? "requested_by_customer" : undefined,
        metadata: {
          reason: body.reason || "Admin refund",
          orderId: order.id
        }
      });
      
      // Create refund record
      const refundRecord = await prisma.refund.create({
        data: {
          orderId: order.id,
          amount: body.amount,
          currency: order.currency,
          provider: "STRIPE",
          providerRefundId: refund.id,
          reason: body.reason || "Admin refund"
        }
      });
      
      // Update order refunded amount
      await prisma.order.update({
        where: { id },
        data: {
          refundedAmount: {
            increment: body.amount
          }
        }
      });
      
      // Update item refunded quantities if specified
      if (body.items) {
        for (const item of body.items) {
          await prisma.orderItem.update({
            where: { id: item.orderItemId },
            data: {
              refundedQty: {
                increment: item.qty
              }
            }
          });
        }
      }
      
      // Log audit action
      await logAudit({
        actorId: "admin", // TODO: get actual admin user ID
        action: "REFUND_PROCESSED",
        entityType: "ORDER",
        entityId: order.id,
        data: {
          refundId: refundRecord.id,
          amount: body.amount,
          reason: body.reason,
          items: body.items
        }
      });
      
      return {
        success: true,
        refund: refundRecord,
        message: "Refund processed successfully"
      };
    } catch (error) {
      fastify.log.error("Admin refund failed:", error as any);
      return reply.status(500).send({
        success: false,
        error: "Failed to process refund"
      });
    }
  });

  // POST /admin/orders/:id/cancel - Cancel order
  fastify.post("/orders/:id/cancel", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = z.object({
        reason: z.string().optional()
      }).parse(request.body);
      
      const order = await prisma.order.findUnique({
        where: { id }
      });
      
      if (!order) {
        return reply.status(404).send({
          success: false,
          error: "Order not found"
        });
      }
      
      if (order.status === "CANCELLED") {
        return reply.status(400).send({
          success: false,
          error: "Order is already cancelled"
        });
      }
      
      // Cancel Stripe payment intent if it exists
      if (order.providerIntentId && stripe) {
        try {
          await stripe.paymentIntents.cancel(order.providerIntentId);
        } catch (stripeError) {
          fastify.log.warn("Failed to cancel Stripe payment intent:", stripeError as any);
        }
      }
      
      // Update order status
      await prisma.order.update({
        where: { id },
        data: {
          status: "CANCELLED",
          canceledAt: new Date()
        }
      });
      
      // Log audit action
      await logAudit({
        actorId: "admin",
        action: "ORDER_CANCELLED",
        entityType: "ORDER",
        entityId: order.id,
        data: {
          reason: body.reason
        }
      });
      
      return {
        success: true,
        message: "Order cancelled successfully"
      };
    } catch (error) {
      fastify.log.error("Admin order cancel failed:", error as any);
      return reply.status(500).send({
        success: false,
        error: "Failed to cancel order"
      });
    }
  });

  // POST /admin/orders/:id/resend-invoice - Resend invoice
  fastify.post("/orders/:id/resend-invoice", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          invoice: true,
          buyer: true
        }
      });
      
      if (!order) {
        return reply.status(404).send({
          success: false,
          error: "Order not found"
        });
      }
      
      if (!order.invoice) {
        return reply.status(400).send({
          success: false,
          error: "No invoice found for this order"
        });
      }
      
      // Generate signed download URL for invoice
      const downloadUrl = await createSignedDownloadUrl({
        key: order.invoice.pdfStorageKey!,
        expiresIn: 3600 // 1 hour
      });
      
      // TODO: Send email with invoice link
      // For now, just return the download URL
      
      return {
        success: true,
        downloadUrl,
        message: "Invoice download link generated"
      };
    } catch (error) {
      fastify.log.error("Admin resend invoice failed:", error as any);
      return reply.status(500).send({
        success: false,
        error: "Failed to resend invoice"
      });
    }
  });

  // POST /admin/notes - Create admin note
  fastify.post("/notes", async (request, reply) => {
    try {
      const body = z.object({
        entityType: z.enum(["ORDER", "ARTWORK", "ARTIST", "USER", "SHIPMENT"]),
        entityId: z.string(),
        body: z.string().min(1)
      }).parse(request.body);
      
      const note = await prisma.adminNote.create({
        data: {
          entityType: body.entityType,
          entityId: body.entityId,
          authorId: "admin", // TODO: get actual admin user ID
          body: body.body
        },
        include: {
          author: true
        }
      });
      
      // Log audit action
      await logAudit({
        actorId: "admin",
        action: "ADMIN_NOTE_CREATED",
        entityType: body.entityType,
        entityId: body.entityId,
        data: {
          noteId: note.id,
          body: body.body
        }
      });
      
      return {
        success: true,
        note
      };
    } catch (error) {
      fastify.log.error("Admin note creation failed:", error as any);
      return reply.status(500).send({
        success: false,
        error: "Failed to create note"
      });
    }
  });

  // DELETE /admin/notes/:id - Delete admin note
  fastify.delete("/notes/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      const note = await prisma.adminNote.findUnique({
        where: { id }
      });
      
      if (!note) {
        return reply.status(404).send({
          success: false,
          error: "Note not found"
        });
      }
      
      await prisma.adminNote.delete({
        where: { id }
      });
      
      // Log audit action
      await logAudit({
        actorId: "admin",
        action: "ADMIN_NOTE_DELETED",
        entityType: note.entityType,
        entityId: note.entityId,
        data: {
          noteId: note.id
        }
      });
      
      return {
        success: true,
        message: "Note deleted successfully"
      };
    } catch (error) {
      fastify.log.error("Admin note deletion failed:", error as any);
      return reply.status(500).send({
        success: false,
        error: "Failed to delete note"
      });
    }
  });

  // POST /admin/exports - Generate CSV export
  fastify.post("/exports", async (request, reply) => {
    try {
      const body = z.object({
        kind: z.enum(["orders", "payouts", "artworks"]),
        from: z.string().optional(),
        to: z.string().optional(),
        filters: z.record(z.any()).optional()
      }).parse(request.body);
      
      const maxRows = parseInt(process.env.ADMIN_EXPORT_MAX_ROWS || "50000");
      
      let data: any[] = [];
      
      switch (body.kind) {
        case "orders":
          data = await prisma.order.findMany({
            where: {
              ...(body.from || body.to ? {
                createdAt: {
                  ...(body.from && { gte: new Date(body.from) }),
                  ...(body.to && { lte: new Date(body.to) })
                }
              } : {})
            },
            include: {
              buyer: true,
              items: {
                include: {
                  artwork: true,
                  edition: true,
                  artist: true
                }
              }
            },
            take: maxRows,
            orderBy: { createdAt: "desc" }
          });
          break;
          
        case "payouts":
          data = await prisma.payout.findMany({
            where: {
              ...(body.from || body.to ? {
                createdAt: {
                  ...(body.from && { gte: new Date(body.from) }),
                  ...(body.to && { lte: new Date(body.to) })
                }
              } : {})
            },
            include: {
              artist: true,
              orderItem: {
                include: {
                  order: true
                }
              }
            },
            take: maxRows,
            orderBy: { createdAt: "desc" }
          });
          break;
          
        case "artworks":
          data = await prisma.artwork.findMany({
            where: {
              ...(body.from || body.to ? {
                createdAt: {
                  ...(body.from && { gte: new Date(body.from) }),
                  ...(body.to && { lte: new Date(body.to) })
                }
              } : {})
            },
            include: {
              artist: true,
              images: true
            },
            take: maxRows,
            orderBy: { createdAt: "desc" }
          });
          break;
      }
      
      // Convert to CSV
      const csv = stringify(data, {
        header: true,
        columns: Object.keys(data[0] || {})
      });
      
      // Generate filename
      const timestamp = format(new Date(), "yyyy-MM-dd-HH-mm-ss");
      const filename = `${body.kind}-${timestamp}.csv`;
      const key = `exports/${filename}`;
      
      // TODO: Upload CSV to storage and return signed URL
      // For now, return the CSV data directly
      
      return {
        success: true,
        filename,
        data: csv,
        rowCount: data.length
      };
    } catch (error) {
      fastify.log.error("Admin export failed:", error as any);
      return reply.status(500).send({
        success: false,
        error: "Failed to generate export"
      });
    }
  });

  // GET /admin/kpi - Get KPI dashboard data
  fastify.get("/kpi", async (request, reply) => {
    try {
      const { from, to } = request.query as any;
      
      const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const toDate = to ? new Date(to) : new Date();
      
      // Get orders data
      const orders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: fromDate,
            lte: toDate
          },
          status: "PAID"
        },
        include: {
          refunds: true,
          shipments: true
        }
      });
      
      // Calculate KPIs
      const ordersCount = orders.length;
      const gmv = orders.reduce((sum, order) => sum + order.totalAmount, 0);
      const refunds = orders.reduce((sum, order) => 
        sum + order.refunds.reduce((refundSum, refund) => 
          refundSum + (refund.status === "SUCCEEDED" ? refund.amount : 0), 0), 0);
      const netRevenue = gmv - refunds;
      const aov = ordersCount > 0 ? gmv / ordersCount : 0;
      const refundRate = gmv > 0 ? (refunds / gmv) * 100 : 0;
      
      // Calculate fulfillment SLA
      const fulfilledOrders = orders.filter(order => 
        order.shipments.some(shipment => 
          shipment.status === "LABEL_PURCHASED" || shipment.status === "IN_TRANSIT"
        )
      );
      
      const avgFulfillmentLeadDays = fulfilledOrders.length > 0 ? 
        fulfilledOrders.reduce((sum, order) => {
          const firstShipment = order.shipments
            .filter(s => s.status === "LABEL_PURCHASED" || s.status === "IN_TRANSIT")
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
          
          if (firstShipment) {
            const leadTime = (firstShipment.createdAt.getTime() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24);
            return sum + leadTime;
          }
          return sum;
        }, 0) / fulfilledOrders.length : 0;
      
      return {
        success: true,
        kpis: {
          ordersCount,
          gmv,
          netRevenue,
          aov,
          refundRate,
          avgFulfillmentLeadDays,
          onTimeRate: avgFulfillmentLeadDays <= 3 ? 100 : Math.max(0, 100 - (avgFulfillmentLeadDays - 3) * 10)
        },
        period: {
          from: fromDate,
          to: toDate
        }
      };
    } catch (error) {
      fastify.log.error("Admin KPI fetch failed:", error as any);
      return reply.status(500).send({
        success: false,
        error: "Failed to fetch KPI data"
      });
    }
  });
}
