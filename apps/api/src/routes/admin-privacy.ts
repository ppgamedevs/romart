import { FastifyInstance } from "fastify"
import { z } from "zod"
import { prisma } from "@artfromromania/db"
import { getSignedDownloadUrl } from "@artfromromania/storage"
import { processExportTask } from "../privacy/exportWorker"
import { processErasureRequest, replayErasures } from "../privacy/erasureWorker"
import { logAudit } from "../moderation/service"

export async function adminPrivacyRoutes(fastify: FastifyInstance) {
  // GET /admin/privacy/exports - List export tasks
  fastify.get("/exports", async (request, reply) => {
    try {
      const { status, page = 1, limit = 20 } = request.query as any

      const where: any = {}
      if (status) {
        where.status = status
      }

      const skip = (page - 1) * limit

      const [tasks, total] = await Promise.all([
        prisma.dataExportTask.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          },
          orderBy: { requestedAt: "desc" },
          skip,
          take: limit
        }),
        prisma.dataExportTask.count({ where })
      ])

      return {
        success: true,
        tasks,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      fastify.log.error("Admin exports fetch failed:", error as any)
      return reply.status(500).send({
        success: false,
        error: "Failed to fetch exports"
      })
    }
  })

  // POST /admin/privacy/exports/:id/cancel - Cancel export task
  fastify.post("/exports/:id/cancel", async (request, reply) => {
    try {
      const { id } = request.params as { id: string }

      const task = await prisma.dataExportTask.findUnique({
        where: { id }
      })

      if (!task) {
        return reply.status(404).send({
          success: false,
          error: "Export task not found"
        })
      }

      if (task.status !== "PENDING" && task.status !== "PROCESSING") {
        return reply.status(400).send({
          success: false,
          error: "Can only cancel pending or processing tasks"
        })
      }

      await prisma.dataExportTask.update({
        where: { id },
        data: {
          status: "CANCELED",
          completedAt: new Date()
        }
      })

      return {
        success: true,
        message: "Export task cancelled"
      }
    } catch (error) {
      fastify.log.error("Export cancellation failed:", error as any)
      return reply.status(500).send({
        success: false,
        error: "Failed to cancel export"
      })
    }
  })

  // POST /admin/privacy/run-export - Process pending exports
  fastify.post("/run-export", async (request, reply) => {
    try {
      const { token } = request.headers as any

      // Simple token validation (in production, use proper authentication)
      if (token !== process.env.ADMIN_CRON_TOKEN) {
        return reply.status(401).send({
          success: false,
          error: "Unauthorized"
        })
      }

      const pendingTasks = await prisma.dataExportTask.findMany({
        where: { status: "PENDING" },
        take: 10 // Process max 10 at a time
      })

      const results = []
      for (const task of pendingTasks) {
        try {
          await processExportTask(task.id)
          results.push({ taskId: task.id, status: "success" })
        } catch (error) {
          results.push({ taskId: task.id, status: "error", error: error instanceof Error ? error.message : "Unknown error" })
        }
      }

      return {
        success: true,
        processed: results.length,
        results
      }
    } catch (error) {
      fastify.log.error("Export processing failed:", error as any)
      return reply.status(500).send({
        success: false,
        error: "Failed to process exports"
      })
    }
  })

  // GET /admin/privacy/deletions - List deletion requests
  fastify.get("/deletions", async (request, reply) => {
    try {
      const { status, page = 1, limit = 20 } = request.query as any

      const where: any = {}
      if (status) {
        where.status = status
      }

      const skip = (page - 1) * limit

      const [requests, total] = await Promise.all([
        prisma.deletionRequest.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          },
          orderBy: { requestedAt: "desc" },
          skip,
          take: limit
        }),
        prisma.deletionRequest.count({ where })
      ])

      return {
        success: true,
        requests,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      fastify.log.error("Admin deletions fetch failed:", error as any)
      return reply.status(500).send({
        success: false,
        error: "Failed to fetch deletions"
      })
    }
  })

  // POST /admin/privacy/deletions/:id/force - Force deletion now
  fastify.post("/deletions/:id/force", async (request, reply) => {
    try {
      const { id } = request.params as { id: string }

      const deletionRequest = await prisma.deletionRequest.findUnique({
        where: { id }
      })

      if (!deletionRequest) {
        return reply.status(404).send({
          success: false,
          error: "Deletion request not found"
        })
      }

      if (deletionRequest.status !== "CONFIRMED") {
        return reply.status(400).send({
          success: false,
          error: "Can only force confirmed deletion requests"
        })
      }

      // Process erasure immediately
      await processErasureRequest(id)

      return {
        success: true,
        message: "Deletion processed immediately"
      }
    } catch (error) {
      fastify.log.error("Force deletion failed:", error as any)
      return reply.status(500).send({
        success: false,
        error: "Failed to force deletion"
      })
    }
  })

  // POST /admin/privacy/run-erasure - Process confirmed deletions
  fastify.post("/run-erasure", async (request, reply) => {
    try {
      const { token } = request.headers as any

      // Simple token validation (in production, use proper authentication)
      if (token !== process.env.ADMIN_CRON_TOKEN) {
        return reply.status(401).send({
          success: false,
          error: "Unauthorized"
        })
      }

      const confirmedRequests = await prisma.deletionRequest.findMany({
        where: {
          status: "CONFIRMED",
          scheduledAt: {
            lte: new Date()
          }
        },
        take: 10 // Process max 10 at a time
      })

      const results = []
      for (const request of confirmedRequests) {
        try {
          await processErasureRequest(request.id)
          results.push({ requestId: request.id, status: "success" })
        } catch (error) {
          results.push({ requestId: request.id, status: "error", error: error instanceof Error ? error.message : "Unknown error" })
        }
      }

      return {
        success: true,
        processed: results.length,
        results
      }
    } catch (error) {
      fastify.log.error("Erasure processing failed:", error as any)
      return reply.status(500).send({
        success: false,
        error: "Failed to process erasures"
      })
    }
  })

  // GET /admin/privacy/tombstones - List erasure tombstones
  fastify.get("/tombstones", async (request, reply) => {
    try {
      const { page = 1, limit = 20 } = request.query as any

      const skip = (page - 1) * limit

      const [tombstones, total] = await Promise.all([
        prisma.erasureTombstone.findMany({
          orderBy: { createdAt: "desc" },
          skip,
          take: limit
        }),
        prisma.erasureTombstone.count()
      ])

      return {
        success: true,
        tombstones,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      fastify.log.error("Tombstones fetch failed:", error as any)
      return reply.status(500).send({
        success: false,
        error: "Failed to fetch tombstones"
      })
    }
  })

  // POST /admin/privacy/replay-erasure - Replay erasures from tombstones
  fastify.post("/replay-erasure", async (request, reply) => {
    try {
      const result = await replayErasures()

      return {
        success: true,
        message: `Replayed ${result.processed} erasures`,
        processed: result.processed
      }
    } catch (error) {
      fastify.log.error("Replay erasure failed:", error as any)
      return reply.status(500).send({
        success: false,
        error: "Failed to replay erasures"
      })
    }
  })

  // GET /admin/privacy/exports/:id/download - Get download link for export
  fastify.get("/exports/:id/download", async (request, reply) => {
    try {
      const { id } = request.params as { id: string }

      const task = await prisma.dataExportTask.findUnique({
        where: { id }
      })

      if (!task) {
        return reply.status(404).send({
          success: false,
          error: "Export task not found"
        })
      }

      if (task.status !== "DONE" || !task.storageKey) {
        return reply.status(400).send({
          success: false,
          error: "Export not ready for download"
        })
      }

      if (task.expiresAt && task.expiresAt < new Date()) {
        return reply.status(400).send({
          success: false,
          error: "Export link has expired"
        })
      }

      const downloadUrl = await getSignedDownloadUrl({
        key: task.storageKey,
        expiresIn: 3600 // 1 hour
      })

      return {
        success: true,
        downloadUrl,
        expiresAt: task.expiresAt
      }
    } catch (error) {
      fastify.log.error("Export download link failed:", error as any)
      return reply.status(500).send({
        success: false,
        error: "Failed to generate download link"
      })
    }
  })
}
