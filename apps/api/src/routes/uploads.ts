import { FastifyInstance } from "fastify"
import { z } from "zod"
import { cuid } from "cuid"
import { createRateLimiter } from "@artfromromania/auth"
import { prisma } from "@artfromromania/db"
import { storage, generateImageKey, getBucketForScope } from "@artfromromania/storage"
import { ImageScope } from "@artfromromania/storage"

const presignSchema = {
  type: "object",
  properties: {
    scope: { type: "string", enum: ["ARTIST_AVATAR", "ARTIST_COVER", "ARTWORK_IMAGE", "KYC_DOC"] },
    entityId: { type: "string" },
    contentType: { type: "string" },
    size: { type: "number", minimum: 1 }
  },
  required: ["scope", "contentType", "size"]
}

const finalizeSchema = {
  type: "object",
  properties: {
    scope: { type: "string", enum: ["ARTIST_AVATAR", "ARTIST_COVER", "ARTWORK_IMAGE", "KYC_DOC"] },
    entityId: { type: "string" },
    key: { type: "string" },
    originalContentType: { type: "string" },
    alt: { type: "string" }
  },
  required: ["scope", "entityId", "key", "originalContentType"]
}

const deleteSchema = {
  type: "object",
  properties: {
    key: { type: "string" }
  },
  required: ["key"]
}

export async function uploadRoutes(fastify: FastifyInstance) {
  const uploadLimiter = createRateLimiter("upload", 60, 60)

  // POST /uploads/presign
  fastify.post("/presign", {
    schema: {
      body: presignSchema,
    },
    preHandler: async (request, reply) => {
      const clientIp = request.ip || "unknown"
      const rateLimit = await uploadLimiter.check(clientIp)
      
      if (!rateLimit.ok) {
        return reply.status(429).send({ error: "rate_limited" })
      }
    },
  }, async (request, reply) => {
    const { scope, entityId, contentType, size } = request.body as z.infer<typeof presignSchema>
    const user = request.user

    if (!user) {
      return reply.status(401).send({ error: "Unauthorized" })
    }

    // Validate user role
    if (user.role !== "ARTIST") {
      return reply.status(403).send({ error: "Only artists can upload images" })
    }

    // Validate MIME type
    const allowedMimeTypes = scope === "KYC_DOC" 
      ? ["image/jpeg", "image/png"]
      : ["image/jpeg", "image/png", "image/webp", "image/avif"]
    
    if (!allowedMimeTypes.includes(contentType)) {
      return reply.status(400).send({ 
        error: `Invalid content type. Allowed: ${allowedMimeTypes.join(", ")}` 
      })
    }

    // Validate file size
    const maxSizeMB = 25
    if (size > maxSizeMB * 1024 * 1024) {
      return reply.status(400).send({ 
        error: `File too large. Maximum size: ${maxSizeMB}MB` 
      })
    }

    // For KYC, ensure user can only upload for their own artist profile
    if (scope === "KYC_DOC") {
      const artist = await prisma.artist.findUnique({
        where: { userId: user.id }
      })
      
      if (!artist || (entityId && entityId !== artist.id)) {
        return reply.status(403).send({ error: "Can only upload KYC docs for your own profile" })
      }
    }

    // Generate unique key
    const cuid2 = cuid()
    const extension = contentType.split("/")[1]
    const key = generateImageKey(scope, entityId || user.id, cuid2, extension)
    const bucket = getBucketForScope(scope, scope === "KYC_DOC")

    try {
      const presignedPost = await storage.presignUpload({
        key,
        bucket,
        contentType,
        maxSizeMB: maxSizeMB,
        expiresIn: 3600, // 1 hour
      })

      return {
        ok: true,
        presignedPost,
        key,
        bucket,
      }
    } catch (error) {
      fastify.log.error("Failed to create presigned upload:", error)
      return reply.status(500).send({ error: "Failed to create upload URL" })
    }
  })

  // POST /media/finalize
  fastify.post("/finalize", {
    schema: {
      body: finalizeSchema,
    },
    preHandler: async (request, reply) => {
      const clientIp = request.ip || "unknown"
      const rateLimit = await uploadLimiter.check(clientIp)
      
      if (!rateLimit.ok) {
        return reply.status(429).send({ error: "rate_limited" })
      }
    },
  }, async (request, reply) => {
    const { scope, entityId, key, originalContentType, alt } = request.body as z.infer<typeof finalizeSchema>
    const user = request.user

    if (!user) {
      return reply.status(401).send({ error: "Unauthorized" })
    }

    if (user.role !== "ARTIST") {
      return reply.status(403).send({ error: "Only artists can finalize uploads" })
    }

    // Verify ownership
    const artist = await prisma.artist.findUnique({
      where: { userId: user.id }
    })

    if (!artist) {
      return reply.status(403).send({ error: "Artist profile not found" })
    }

    if (scope === "KYC_DOC" && entityId !== artist.id) {
      return reply.status(403).send({ error: "Can only finalize KYC docs for your own profile" })
    }

    try {
      // Check if file exists in storage
      const bucket = getBucketForScope(scope, scope === "KYC_DOC")
      const headResult = await storage.headObject(key, bucket)
      
      if (!headResult.exists) {
        return reply.status(404).send({ error: "Uploaded file not found" })
      }

      // For now, we'll just create a basic image record
      // In a full implementation, this would process the image with sharp
      const imageUrl = scope === "KYC_DOC" 
        ? null // KYC images don't get public URLs
        : storage.getPublicUrl(key)

      const image = await prisma.image.create({
        data: {
          kind: scope as any,
          url: imageUrl || key, // Use key as fallback for private images
          storageKey: key,
          contentType: originalContentType,
          sizeBytes: headResult.size,
          alt: alt,
          artistId: scope !== "ARTWORK_IMAGE" ? artist.id : undefined,
          artworkId: scope === "ARTWORK_IMAGE" ? entityId : undefined,
        }
      })

      // Update artist profile for avatar/cover
      if (scope === "ARTIST_AVATAR") {
        await prisma.artist.update({
          where: { id: artist.id },
          data: { avatarUrl: imageUrl }
        })
      } else if (scope === "ARTIST_COVER") {
        await prisma.artist.update({
          where: { id: artist.id },
          data: { coverUrl: imageUrl }
        })
      }

      return {
        ok: true,
        image: {
          id: image.id,
          url: imageUrl,
          key,
          size: headResult.size,
        }
      }
    } catch (error) {
      fastify.log.error("Failed to finalize upload:", error)
      return reply.status(500).send({ error: "Failed to finalize upload" })
    }
  })

  // DELETE /media
  fastify.delete("/media", {
    schema: {
      body: deleteSchema,
    },
    preHandler: async (request, reply) => {
      const clientIp = request.ip || "unknown"
      const rateLimit = await uploadLimiter.check(clientIp)
      
      if (!rateLimit.ok) {
        return reply.status(429).send({ error: "rate_limited" })
      }
    },
  }, async (request, reply) => {
    const { key } = request.body as z.infer<typeof deleteSchema>
    const user = request.user

    if (!user) {
      return reply.status(401).send({ error: "Unauthorized" })
    }

    if (user.role !== "ARTIST") {
      return reply.status(403).send({ error: "Only artists can delete images" })
    }

    try {
      // Find image and verify ownership
      const image = await prisma.image.findFirst({
        where: {
          storageKey: key,
          artist: {
            userId: user.id
          }
        }
      })

      if (!image) {
        return reply.status(404).send({ error: "Image not found or access denied" })
      }

      // Delete from storage
      const bucket = getBucketForScope(image.kind as ImageScope, image.kind === "KYC")
      await storage.delete(key, bucket)

      // Mark as deleted in database
      await prisma.image.update({
        where: { id: image.id },
        data: { url: null, storageKey: null }
      })

      return { ok: true }
    } catch (error) {
      fastify.log.error("Failed to delete image:", error)
      return reply.status(500).send({ error: "Failed to delete image" })
    }
  })
}
