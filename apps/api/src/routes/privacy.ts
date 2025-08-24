import { FastifyInstance } from "fastify"
import { z } from "zod"
import { prisma } from "@artfromromania/db"
import { logAudit } from "../moderation/service"
import { randomBytes, createHash } from "crypto"

export async function privacyRoutes(fastify: FastifyInstance) {
  // POST /privacy/export - Request data export
  fastify.post("/export", async (request, reply) => {
    try {
      const userId = (request.user as any)?.id

      if (!userId) {
        return reply.status(401).send({
          success: false,
          error: "Authentication required"
        })
      }

      // Check for existing pending/processing tasks
      const existingTask = await prisma.dataExportTask.findFirst({
        where: {
          userId,
          status: {
            in: ["PENDING", "PROCESSING"]
          }
        }
      })

      if (existingTask) {
        return reply.status(400).send({
          success: false,
          error: "Export already in progress"
        })
      }

      // Create export task
      const task = await prisma.dataExportTask.create({
        data: {
          userId,
          status: "PENDING",
          format: "ZIP"
        }
      })

      // Log audit action
      await logAudit({
        actorId: userId,
        action: "PRIVACY_EXPORT_REQUEST",
        entityType: "USER",
        entityId: userId,
        data: {
          taskId: task.id
        }
      })

      return {
        success: true,
        task,
        message: "Export request submitted. You will receive an email when ready."
      }
    } catch (error) {
      fastify.log.error("Export request failed:", error as any)
      return reply.status(500).send({
        success: false,
        error: "Failed to request export"
      })
    }
  })

  // GET /privacy/export/:id - Get export task status and download link
  fastify.get("/export/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const userId = (request.user as any)?.id

      if (!userId) {
        return reply.status(401).send({
          success: false,
          error: "Authentication required"
        })
      }

      const task = await prisma.dataExportTask.findFirst({
        where: {
          id,
          userId
        }
      })

      if (!task) {
        return reply.status(404).send({
          success: false,
          error: "Export task not found"
        })
      }

      return {
        success: true,
        task
      }
    } catch (error) {
      fastify.log.error("Export status fetch failed:", error as any)
      return reply.status(500).send({
        success: false,
        error: "Failed to fetch export status"
      })
    }
  })

  // POST /privacy/delete/request - Request account deletion
  fastify.post("/delete/request", async (request, reply) => {
    try {
      const body = z.object({
        reason: z.string().optional()
      }).parse(request.body)

      const userId = (request.user as any)?.id

      if (!userId) {
        return reply.status(401).send({
          success: false,
          error: "Authentication required"
        })
      }

      // Check for existing deletion request
      const existingRequest = await prisma.deletionRequest.findFirst({
        where: {
          userId,
          status: {
            in: ["REQUESTED", "CONFIRMED"]
          }
        }
      })

      if (existingRequest) {
        return reply.status(400).send({
          success: false,
          error: "Deletion request already exists"
        })
      }

      // Generate confirmation token
      const token = randomBytes(32).toString("hex")
      const tokenHash = createHash("sha256").update(token).digest("hex")

      // Create deletion request
      const deletionRequest = await prisma.deletionRequest.create({
        data: {
          userId,
          status: "REQUESTED",
          reason: body.reason,
          tokenHash
        }
      })

      // TODO: Send confirmation email with token
      // For now, return the token in response (in production, send via email)
      fastify.log.info(`Deletion confirmation token for user ${userId}: ${token}`)

      // Log audit action
      await logAudit({
        actorId: userId,
        action: "PRIVACY_DELETE_REQUEST",
        entityType: "USER",
        entityId: userId,
        data: {
          requestId: deletionRequest.id,
          reason: body.reason
        }
      })

      return {
        success: true,
        message: "Deletion request submitted. Check your email for confirmation.",
        // In production, remove this token from response
        token: token
      }
    } catch (error) {
      fastify.log.error("Deletion request failed:", error as any)
      return reply.status(500).send({
        success: false,
        error: "Failed to request deletion"
      })
    }
  })

  // GET /privacy/delete/confirm - Confirm deletion with token
  fastify.get("/delete/confirm", async (request, reply) => {
    try {
      const { token } = request.query as { token: string }

      if (!token) {
        return reply.status(400).send({
          success: false,
          error: "Token required"
        })
      }

      const tokenHash = createHash("sha256").update(token).digest("hex")

      const deletionRequest = await prisma.deletionRequest.findFirst({
        where: {
          tokenHash,
          status: "REQUESTED"
        },
        include: {
          user: true
        }
      })

      if (!deletionRequest) {
        return reply.status(404).send({
          success: false,
          error: "Invalid or expired token"
        })
      }

      // Calculate scheduled date (grace period)
      const graceDays = parseInt(process.env.DATA_ERASURE_GRACE_DAYS || "7")
      const scheduledAt = new Date(Date.now() + graceDays * 24 * 60 * 60 * 1000)

      // Update request status
      await prisma.deletionRequest.update({
        where: { id: deletionRequest.id },
        data: {
          status: "CONFIRMED",
          confirmedAt: new Date(),
          scheduledAt
        }
      })

      return {
        success: true,
        message: `Account deletion confirmed. Your account will be deleted on ${scheduledAt.toLocaleDateString()}.`,
        scheduledAt
      }
    } catch (error) {
      fastify.log.error("Deletion confirmation failed:", error as any)
      return reply.status(500).send({
        success: false,
        error: "Failed to confirm deletion"
      })
    }
  })

  // POST /privacy/delete/cancel - Cancel deletion request
  fastify.post("/delete/cancel", async (request, reply) => {
    try {
      const userId = (request.user as any)?.id

      if (!userId) {
        return reply.status(401).send({
          success: false,
          error: "Authentication required"
        })
      }

      const deletionRequest = await prisma.deletionRequest.findFirst({
        where: {
          userId,
          status: "CONFIRMED"
        }
      })

      if (!deletionRequest) {
        return reply.status(404).send({
          success: false,
          error: "No confirmed deletion request found"
        })
      }

      // Update request status
      await prisma.deletionRequest.update({
        where: { id: deletionRequest.id },
        data: {
          status: "CANCELED"
        }
      })

      return {
        success: true,
        message: "Deletion request cancelled"
      }
    } catch (error) {
      fastify.log.error("Deletion cancellation failed:", error as any)
      return reply.status(500).send({
        success: false,
        error: "Failed to cancel deletion"
      })
    }
  })
}
