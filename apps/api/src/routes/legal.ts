import { FastifyInstance } from "fastify"
import { z } from "zod"
import { prisma } from "@artfromromania/db"
import { logAudit } from "../moderation/service"

export async function legalRoutes(fastify: FastifyInstance) {
  // GET /legal/current - Get current legal documents
  fastify.get("/current", async (request, reply) => {
    try {
      const documents = await prisma.legalDocument.findMany({
        where: {
          effectiveAt: {
            lte: new Date()
          }
        },
        orderBy: [
          { kind: "asc" },
          { effectiveAt: "desc" }
        ]
      })

      // Get the latest version for each kind
      const currentDocs = documents.reduce((acc, doc) => {
        if (!acc[doc.kind] || acc[doc.kind].effectiveAt < doc.effectiveAt) {
          acc[doc.kind] = doc
        }
        return acc
      }, {} as Record<string, any>)

      return {
        success: true,
        documents: currentDocs
      }
    } catch (error) {
      fastify.log.error("Legal documents fetch failed:", error as any)
      return reply.status(500).send({
        success: false,
        error: "Failed to fetch legal documents"
      })
    }
  })

  // POST /legal/accept - Accept legal document
  fastify.post("/accept", async (request, reply) => {
    try {
      const body = z.object({
        kind: z.enum(["TOS", "PRIVACY", "COOKIES"]),
        version: z.string()
      }).parse(request.body)

      const userId = (request.user as any)?.id

      if (!userId) {
        return reply.status(401).send({
          success: false,
          error: "Authentication required"
        })
      }

      // Find the document
      const document = await prisma.legalDocument.findFirst({
        where: {
          kind: body.kind,
          version: body.version
        }
      })

      if (!document) {
        return reply.status(404).send({
          success: false,
          error: "Legal document not found"
        })
      }

      // Check if already accepted
      const existingAcceptance = await prisma.legalAcceptance.findFirst({
        where: {
          userId,
          docId: document.id
        }
      })

      if (existingAcceptance) {
        return reply.status(400).send({
          success: false,
          error: "Document already accepted"
        })
      }

      // Create acceptance
      const acceptance = await prisma.legalAcceptance.create({
        data: {
          userId,
          docId: document.id,
          version: body.version
        }
      })

      // Log audit action
      await logAudit({
        actorId: userId,
        action: "LEGAL_ACCEPTED",
        entityType: "USER",
        entityId: userId,
        data: {
          kind: body.kind,
          version: body.version,
          acceptanceId: acceptance.id
        }
      })

      return {
        success: true,
        acceptance
      }
    } catch (error) {
      fastify.log.error("Legal acceptance failed:", error as any)
      return reply.status(500).send({
        success: false,
        error: "Failed to accept legal document"
      })
    }
  })

  // GET /legal/acceptances - Get user's legal acceptances
  fastify.get("/acceptances", async (request, reply) => {
    try {
      const userId = (request.user as any)?.id

      if (!userId) {
        return reply.status(401).send({
          success: false,
          error: "Authentication required"
        })
      }

      const acceptances = await prisma.legalAcceptance.findMany({
        where: { userId },
        include: {
          doc: true
        },
        orderBy: { createdAt: "desc" }
      })

      return {
        success: true,
        acceptances
      }
    } catch (error) {
      fastify.log.error("Legal acceptances fetch failed:", error as any)
      return reply.status(500).send({
        success: false,
        error: "Failed to fetch legal acceptances"
      })
    }
  })
}
