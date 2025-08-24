import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@artfromromania/db";
import { logAudit } from "../moderation/service";

export async function returnsRoutes(fastify: FastifyInstance) {
  // POST /returns - Initiate return
  fastify.post("/", async (request, reply) => {
    try {
      const body = z.object({
        orderId: z.string(),
        items: z.array(z.object({
          orderItemId: z.string(),
          qty: z.number().int().positive(),
          reason: z.string().min(1)
        })),
        customerNotes: z.string().optional()
      }).parse(request.body);
      
      // Verify order exists and is eligible for return
      const order = await prisma.order.findUnique({
        where: { id: body.orderId },
        include: {
          items: true,
          returns: true
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
          error: "Order must be paid to initiate return"
        });
      }
      
      // Check if return already exists for this order
      const existingReturn = await prisma.return.findFirst({
        where: { orderId: body.orderId }
      });
      
      if (existingReturn) {
        return reply.status(400).send({
          success: false,
          error: "Return already exists for this order"
        });
      }
      
      // Validate items
      for (const item of body.items) {
        const orderItem = order.items.find(oi => oi.id === item.orderItemId);
        if (!orderItem) {
          return reply.status(400).send({
            success: false,
            error: `Order item ${item.orderItemId} not found`
          });
        }
        
        if (item.qty > orderItem.quantity - orderItem.refundedQty) {
          return reply.status(400).send({
            success: false,
            error: `Cannot return more than available quantity for item ${item.orderItemId}`
          });
        }
      }
      
      // Create return
      const returnRecord = await prisma.return.create({
        data: {
          orderId: body.orderId,
          status: "REQUESTED",
          reason: body.customerNotes,
          items: {
            create: body.items.map(item => ({
              orderItemId: item.orderItemId,
              qty: item.qty,
              reason: item.reason
            }))
          }
        },
        include: {
          items: {
            include: {
              orderItem: {
                include: {
                  artwork: true,
                  edition: true,
                  artist: true
                }
              }
            }
          }
        }
      });
      
      // Log audit action
      await logAudit({
        actorId: "customer", // TODO: get actual customer ID
        action: "RETURN_INITIATED",
        entityType: "ORDER",
        entityId: body.orderId,
        data: {
          returnId: returnRecord.id,
          items: body.items
        }
      });
      
      return {
        success: true,
        return: returnRecord,
        message: "Return initiated successfully"
      };
    } catch (error) {
      fastify.log.error("Return initiation failed:", error as any);
      return reply.status(500).send({
        success: false,
        error: "Failed to initiate return"
      });
    }
  });

  // GET /returns/:id - Get return details
  fastify.get("/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      const returnRecord = await prisma.return.findUnique({
        where: { id },
        include: {
          order: {
            include: {
              buyer: true
            }
          },
          items: {
            include: {
              orderItem: {
                include: {
                  artwork: true,
                  edition: true,
                  artist: true
                }
              }
            }
          },
          creditNotes: true
        }
      });
      
      if (!returnRecord) {
        return reply.status(404).send({
          success: false,
          error: "Return not found"
        });
      }
      
      return {
        success: true,
        return: returnRecord
      };
    } catch (error) {
      fastify.log.error("Return fetch failed:", error as any);
      return reply.status(500).send({
        success: false,
        error: "Failed to fetch return"
      });
    }
  });

  // POST /admin/returns/:id/receive - Mark return as received
  fastify.post("/admin/:id/receive", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = z.object({
        notes: z.string().optional()
      }).parse(request.body);
      
      const returnRecord = await prisma.return.findUnique({
        where: { id },
        include: {
          order: true
        }
      });
      
      if (!returnRecord) {
        return reply.status(404).send({
          success: false,
          error: "Return not found"
        });
      }
      
              if (returnRecord.status !== "REQUESTED") {
        return reply.status(400).send({
          success: false,
          error: "Return must be pending to mark as received"
        });
      }
      
      // Update return status
      await prisma.return.update({
        where: { id },
        data: {
          status: "RECEIVED",
          receivedAt: new Date(),
          adminNotes: body.notes
        }
      });
      
      // Log audit action
      await logAudit({
        actorId: "admin",
        action: "RETURN_RECEIVED",
        entityType: "ORDER",
        entityId: returnRecord.orderId,
        data: {
          returnId: returnRecord.id,
          notes: body.notes
        }
      });
      
      return {
        success: true,
        message: "Return marked as received"
      };
    } catch (error) {
      fastify.log.error("Return receive failed:", error as any);
      return reply.status(500).send({
        success: false,
        error: "Failed to mark return as received"
      });
    }
  });

  // POST /admin/returns/:id/qc - Process QC inspection
  fastify.post("/admin/:id/qc", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = z.object({
        passed: z.boolean(),
        notes: z.string().optional(),
        items: z.array(z.object({
          returnItemId: z.string(),
          passed: z.boolean(),
          notes: z.string().optional()
        }))
      }).parse(request.body);
      
      const returnRecord = await prisma.return.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              orderItem: true
            }
          },
          order: true
        }
      });
      
      if (!returnRecord) {
        return reply.status(404).send({
          success: false,
          error: "Return not found"
        });
      }
      
      if (returnRecord.status !== "RECEIVED") {
        return reply.status(400).send({
          success: false,
          error: "Return must be received to process QC"
        });
      }
      
      // Update return status
      await prisma.return.update({
        where: { id },
        data: {
          status: body.passed ? "QC_PASSED" : "QC_FAILED",
          qcPassed: body.passed,
          qcNotes: body.notes,
          qcAt: new Date()
        }
      });
      
      // Update individual items
      for (const item of body.items) {
        await prisma.returnItem.update({
          where: { id: item.returnItemId },
          data: {
            qcPassed: item.passed,
            qcNotes: item.notes
          }
        });
      }
      
      // If QC passed, create credit note
      if (body.passed) {
        const passedItems = returnRecord.items.filter(item => 
          body.items.find(qcItem => 
            qcItem.returnItemId === item.id && qcItem.passed
          )
        );
        
        if (passedItems.length > 0) {
          const totalAmount = passedItems.reduce((sum, item) => 
            sum + (item.orderItem.unitAmount * item.qty), 0
          );
          
          await prisma.creditNote.create({
            data: {
              returnId: returnRecord.id,
              orderId: returnRecord.orderId,
              number: `CN-${Date.now()}`,
              totalAmount: totalAmount,
              currency: returnRecord.order.currency,
              status: "PENDING",
              reason: "Return QC Passed"
            }
          });
        }
      }
      
      // Log audit action
      await logAudit({
        actorId: "admin",
        action: "RETURN_QC_COMPLETED",
        entityType: "ORDER",
        entityId: returnRecord.orderId,
        data: {
          returnId: returnRecord.id,
          passed: body.passed,
          notes: body.notes
        }
      });
      
      return {
        success: true,
        message: `Return QC ${body.passed ? "passed" : "failed"}`
      };
    } catch (error) {
      fastify.log.error("Return QC failed:", error as any);
      return reply.status(500).send({
        success: false,
        error: "Failed to process QC"
      });
    }
  });

  // POST /admin/returns/:id/restock - Restock items
  fastify.post("/admin/:id/restock", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      const returnRecord = await prisma.return.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              orderItem: {
                include: {
                  artwork: true,
                  edition: true
                }
              }
            }
          },
          order: true
        }
      });
      
      if (!returnRecord) {
        return reply.status(404).send({
          success: false,
          error: "Return not found"
        });
      }
      
      if (returnRecord.status !== "QC_PASSED") {
        return reply.status(400).send({
          success: false,
          error: "Return must pass QC to restock"
        });
      }
      
      // Restock items
      for (const item of returnRecord.items) {
        if (item.qcPassed) {
          if (item.orderItem.edition) {
            // Restock edition
            await prisma.edition.update({
              where: { id: item.orderItem.edition.id },
              data: {
                available: {
                  increment: item.qty
                }
              }
            });
          } else {
            // Original artwork - mark as available again
            if (item.orderItem.artwork) {
              await prisma.artwork.update({
                where: { id: item.orderItem.artwork.id },
                data: {
                  status: "PUBLISHED"
                }
              });
            }
          }
        }
      }
      
      // Update return status
      await prisma.return.update({
        where: { id },
        data: {
          status: "RESTOCKED",
          restockedAt: new Date()
        }
      });
      
      // Log audit action
      await logAudit({
        actorId: "admin",
        action: "RETURN_RESTOCKED",
        entityType: "ORDER",
        entityId: returnRecord.orderId,
        data: {
          returnId: returnRecord.id
        }
      });
      
      return {
        success: true,
        message: "Items restocked successfully"
      };
    } catch (error) {
      fastify.log.error("Return restock failed:", error as any);
      return reply.status(500).send({
        success: false,
        error: "Failed to restock items"
      });
    }
  });

  // POST /admin/credit-notes/:id/issue - Issue credit note
  fastify.post("/admin/credit-notes/:id/issue", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      const creditNote = await prisma.creditNote.findUnique({
        where: { id },
        include: {
          order: true,
          return: true
        }
      });
      
      if (!creditNote) {
        return reply.status(404).send({
          success: false,
          error: "Credit note not found"
        });
      }
      
      if (creditNote.status !== "PENDING") {
        return reply.status(400).send({
          success: false,
          error: "Credit note must be pending to issue"
        });
      }
      
      // TODO: Integrate with payment provider to issue refund
      // For now, just mark as issued
      
      await prisma.creditNote.update({
        where: { id },
        data: {
          status: "ISSUED",
          issuedAt: new Date()
        }
      });
      
      // Log audit action
      await logAudit({
        actorId: "admin",
        action: "CREDIT_NOTE_ISSUED",
        entityType: "ORDER",
        entityId: creditNote.orderId,
        data: {
          creditNoteId: creditNote.id,
          amount: creditNote.totalAmount
        }
      });
      
      return {
        success: true,
        message: "Credit note issued successfully"
      };
    } catch (error) {
      fastify.log.error("Credit note issue failed:", error as any);
      return reply.status(500).send({
        success: false,
        error: "Failed to issue credit note"
      });
    }
  });

  // GET /admin/returns - List returns for admin
  fastify.get("/admin", async (request, reply) => {
    try {
      const { status, page = 1, limit = 20 } = request.query as any;
      
      const where: any = {};
      if (status) {
        where.status = status;
      }
      
      const skip = (page - 1) * limit;
      
      const [returns, total] = await Promise.all([
        prisma.return.findMany({
          where,
          include: {
            order: {
              include: {
                buyer: true
              }
            },
            items: {
              include: {
                orderItem: {
                  include: {
                    artwork: true,
                    edition: true,
                    artist: true
                  }
                }
              }
            },
            creditNotes: true
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit
        }),
        prisma.return.count({ where })
      ]);
      
      return {
        success: true,
        returns,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      fastify.log.error("Admin returns fetch failed:", error as any);
      return reply.status(500).send({
        success: false,
        error: "Failed to fetch returns"
      });
    }
  });
}
