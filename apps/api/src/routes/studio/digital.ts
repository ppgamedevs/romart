import { FastifyInstance } from "fastify";
import { createRateLimiter } from "@artfromromania/auth";
import { updateEditionDigitalFile } from "@artfromromania/db";
import { storage, getBucketForScope, generateImageKey } from "@artfromromania/storage";
import { z } from "zod";
import cuid from "cuid";
import { createHash } from "crypto";

const digitalUploadSchema = z.object({
  editionId: z.string(),
  contentType: z.string(),
  size: z.number()
});

const digitalFinalizeSchema = z.object({
  editionId: z.string(),
  key: z.string()
});

export async function digitalRoutes(fastify: FastifyInstance) {
  const rateLimiter = createRateLimiter("digital-upload", 60, 10); // 10 requests per minute

  // Auth middleware
  const requireAuth = async (request: any, reply: any) => {
    if (!request.user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
  };

  // Role-based auth
  const requireArtistOrAdmin = async (request: any, reply: any) => {
    if (!request.user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    if (!["ARTIST", "ADMIN"].includes(request.user.role)) {
      return reply.status(403).send({ error: "Forbidden" });
    }
  };

  // Rate limiter middleware wrapper
  const rateLimitMiddleware = (limiter: any) => async (request: any, reply: any) => {
    const clientIp = request.ip || "unknown";
    const rateLimit = await limiter.check(clientIp);
    
    if (!rateLimit.ok) {
      return reply.status(429).send({ error: "Rate limited" });
    }
  };

  // Presign upload for digital file
  fastify.post("/upload", {
    preHandler: [
      rateLimitMiddleware(rateLimiter),
      requireArtistOrAdmin
    ]
  }, async (request, reply) => {
    try {
      const { editionId, contentType, size } = digitalUploadSchema.parse(request.body);
      
      // Validate edition exists and belongs to artist (if not admin)
      const edition = await fastify.prisma.edition.findUnique({
        where: { id: editionId },
        include: {
          artwork: {
            include: {
              artist: true
            }
          }
        }
      });

      if (!edition) {
        return reply.status(404).send({ error: "Edition not found" });
      }

      // Check if user owns this edition (unless admin)
      if (request.user!.role !== "ADMIN" && edition.artwork.artist.userId !== request.user!.id) {
        return reply.status(403).send({ error: "Not authorized to upload for this edition" });
      }

      // Check if edition is DIGITAL type
      if (edition.type !== "DIGITAL") {
        return reply.status(400).send({ error: "Only DIGITAL editions can have file uploads" });
      }

      // Generate file key
      const fileId = cuid();
      const extension = contentType.split("/")[1] || "bin";
      const key = generateImageKey("DIGITAL_FILE", editionId, fileId, extension);
      const bucket = getBucketForScope("DIGITAL_FILE");

      // Create presigned upload
      const presignResult = await storage.presignUpload({
        key,
        bucket,
        contentType,
        maxSizeMB: 100, // 100MB limit for digital files
        expiresIn: 3600
      });

      return reply.send({
        ...presignResult,
        fileId
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: "Failed to create upload URL" });
    }
  });

  // Finalize upload and update edition
  fastify.post("/finalize", {
    preHandler: [
      rateLimitMiddleware(rateLimiter),
      requireArtistOrAdmin
    ]
  }, async (request, reply) => {
    try {
      const { editionId, key } = digitalFinalizeSchema.parse(request.body);
      
      // Validate edition exists and belongs to artist (if not admin)
      const edition = await fastify.prisma.edition.findUnique({
        where: { id: editionId },
        include: {
          artwork: {
            include: {
              artist: true
            }
          }
        }
      });

      if (!edition) {
        return reply.status(404).send({ error: "Edition not found" });
      }

      // Check if user owns this edition (unless admin)
      if (request.user!.role !== "ADMIN" && edition.artwork.artist.userId !== request.user!.id) {
        return reply.status(403).send({ error: "Not authorized to finalize upload for this edition" });
      }

      const bucket = getBucketForScope("DIGITAL_FILE");

      // Check if file exists and get metadata
      const fileInfo = await storage.headObject(key, bucket);
      if (!fileInfo.exists) {
        return reply.status(404).send({ error: "Uploaded file not found" });
      }

      // Calculate SHA256 hash
      let checksumSha256: string;
      try {
        const stream = await storage.getObjectStream(key, bucket);
        const hash = createHash('sha256');
        
        await new Promise((resolve, reject) => {
          stream.on('data', (chunk) => hash.update(chunk));
          stream.on('end', resolve);
          stream.on('error', reject);
        });
        
        checksumSha256 = hash.digest('hex');
      } catch (error) {
        fastify.log.error("Failed to calculate file hash:", error as any);
        checksumSha256 = ""; // Fallback - we'll update this later if needed
      }

      // Update edition with file metadata
      await updateEditionDigitalFile(fastify.prisma, editionId, {
        privateFileKey: key,
        contentType: fileInfo.contentType || "application/octet-stream",
        fileBytes: fileInfo.size || 0,
        checksumSha256
      });

      return reply.send({
        success: true,
        edition: {
          id: editionId,
          privateFileKey: key,
          contentType: fileInfo.contentType,
          fileBytes: fileInfo.size,
          checksumSha256
        }
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: "Failed to finalize upload" });
    }
  });
}
