import { FastifyInstance } from "fastify"
import { z } from "zod"
import { prisma } from "@artfromromania/db"
import { logAudit } from "../moderation/service"

export async function consentRoutes(fastify: FastifyInstance) {
  // POST /consent - Save consent preferences
  fastify.post("/", async (request, reply) => {
    try {
      const body = z.object({
        kind: z.enum(["ANALYTICS", "MARKETING", "NECESSARY"]),
        granted: z.boolean(),
        anonymousId: z.string().optional()
      }).parse(request.body)

      const userId = (request.user as any)?.id
      const ip = request.ip || request.headers["x-forwarded-for"] as string || request.headers["x-real-ip"] as string
      const userAgent = request.headers["user-agent"]

      // Get country from IP (simplified - in production use a geo service)
      const country = "RO" // TODO: implement geo lookup

      // Save consent
      const consent = await prisma.consent.create({
        data: {
          userId: userId || null,
          anonymousId: body.anonymousId || null,
          kind: body.kind,
          granted: body.granted,
          source: "CMP",
          country,
          ip,
          userAgent
        }
      })

      // Log audit action
      if (userId) {
        await logAudit({
          actorId: userId,
          action: "CONSENT_UPDATED",
          entityType: "USER",
          entityId: userId,
          data: {
            kind: body.kind,
            granted: body.granted,
            consentId: consent.id
          }
        })
      }

      return {
        success: true,
        consent
      }
    } catch (error) {
      fastify.log.error("Consent save failed:", error as any)
      return reply.status(500).send({
        success: false,
        error: "Failed to save consent"
      })
    }
  })

  // GET /consent/me - Get current consent preferences
  fastify.get("/me", async (request, reply) => {
    try {
      const userId = (request.user as any)?.id
      const query = request.query as { anonymousId?: string }
      const anonymousId = query.anonymousId

      if (!userId && !anonymousId) {
        return reply.status(400).send({
          success: false,
          error: "User ID or anonymous ID required"
        })
      }

      const consents = await prisma.consent.findMany({
        where: {
          OR: [
            { userId: userId || undefined },
            { anonymousId: anonymousId || undefined }
          ]
        },
        orderBy: { createdAt: "desc" },
        distinct: ["kind"]
      })

      // Group by kind and get the latest for each
      const consentMap = consents.reduce((acc, consent) => {
        acc[consent.kind] = consent.granted
        return acc
      }, {} as Record<string, boolean>)

      return {
        success: true,
        consents: consentMap
      }
    } catch (error) {
      fastify.log.error("Consent fetch failed:", error as any)
      return reply.status(500).send({
        success: false,
        error: "Failed to fetch consent"
      })
    }
  })
}
