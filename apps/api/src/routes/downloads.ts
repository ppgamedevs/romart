import { FastifyInstance } from "fastify";
import { createRateLimiter } from "@artfromromania/auth";
import { incrementDownloadCount, getUserDigitalEntitlements } from "@artfromromania/db";
import { storage, getBucketForScope } from "@artfromromania/storage";
import sharp from "sharp";
import { z } from "zod";
import cuid from "cuid";

const createLinkSchema = z.object({
  entitlementId: z.string()
});

// In-memory cache for short-lived download tokens
const downloadTokens = new Map<string, {
  entitlementId: string;
  expiresAt: number;
}>();

// Clean up expired tokens every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of downloadTokens.entries()) {
    if (data.expiresAt < now) {
      downloadTokens.delete(token);
    }
  }
}, 5 * 60 * 1000);

export async function downloadRoutes(fastify: FastifyInstance) {
  const linkRateLimiter = createRateLimiter("download-link", 120, 60); // 120 requests per minute
  const fileRateLimiter = createRateLimiter("download-file", 60, 60); // 60 downloads per minute

  // Auth middleware
  const requireAuth = async (request: any, reply: any) => {
    if (!request.user) {
      return reply.status(401).send({ error: "Unauthorized" });
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

  // Get user's digital entitlements
  fastify.get("/entitlements", {
    preHandler: [
      rateLimitMiddleware(linkRateLimiter),
      requireAuth
    ]
  }, async (request, reply) => {
    try {
      const entitlements = await getUserDigitalEntitlements(fastify.prisma, request.user!.id);
      
      return reply.send({
        entitlements
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: "Failed to fetch entitlements" });
    }
  });

  // Create short-lived download link
  fastify.post("/link", {
    preHandler: [
      rateLimitMiddleware(linkRateLimiter),
      requireAuth
    ]
  }, async (request, reply) => {
    try {
      const { entitlementId } = createLinkSchema.parse(request.body);
      
      // Get and validate entitlement
      const entitlement = await fastify.prisma.digitalEntitlement.findUnique({
        where: { id: entitlementId },
        include: {
          edition: {
            select: {
              privateFileKey: true,
              contentType: true,
              artwork: {
                select: {
                  title: true
                }
              }
            }
          },
          user: {
            select: {
              id: true
            }
          }
        }
      });

      if (!entitlement) {
        return reply.status(404).send({ error: "Digital entitlement not found" });
      }

      // Check if user owns this entitlement
      if (entitlement.user.id !== request.user!.id) {
        return reply.status(403).send({ error: "Not authorized to download this file" });
      }

      // Check download limits
      if (entitlement.downloadsCount >= entitlement.maxDownloads) {
        return reply.status(403).send({ 
          error: "Download limit exceeded",
          details: {
            downloadsUsed: entitlement.downloadsCount,
            maxDownloads: entitlement.maxDownloads
          }
        });
      }

      // Check expiration
      if (entitlement.expiresAt && entitlement.expiresAt < new Date()) {
        return reply.status(403).send({ error: "Digital entitlement has expired" });
      }

      // Check if file exists
      if (!entitlement.edition.privateFileKey) {
        return reply.status(404).send({ error: "Digital file not available" });
      }

      // Create short-lived download token
      const ttlSeconds = parseInt(process.env.DOWNLOAD_TOKEN_TTL_SECONDS || "900", 10);
      const downloadToken = cuid();
      const expiresAt = Date.now() + (ttlSeconds * 1000);
      
      downloadTokens.set(downloadToken, {
        entitlementId,
        expiresAt
      });

      const downloadUrl = `/downloads/file?token=${downloadToken}`;

      return reply.send({
        downloadUrl,
        expiresAt: new Date(expiresAt).toISOString(),
        filename: `${entitlement.edition.artwork.title}.${entitlement.edition.contentType?.split('/')[1] || 'bin'}`
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: "Failed to create download link" });
    }
  });

  // Download file with short-lived token
  fastify.get("/file", {
    preHandler: [rateLimitMiddleware(fileRateLimiter)]
  }, async (request, reply) => {
    try {
      const token = (request.query as any).token;
      
      if (!token) {
        return reply.status(400).send({ error: "Download token required" });
      }

      // Validate download token
      const tokenData = downloadTokens.get(token);
      if (!tokenData) {
        return reply.status(401).send({ error: "Invalid or expired download token" });
      }

      if (tokenData.expiresAt < Date.now()) {
        downloadTokens.delete(token);
        return reply.status(401).send({ error: "Download token has expired" });
      }

      // Get entitlement
      const entitlement = await fastify.prisma.digitalEntitlement.findUnique({
        where: { id: tokenData.entitlementId },
        include: {
          edition: {
            select: {
              id: true,
              privateFileKey: true,
              contentType: true,
              fileBytes: true,
              checksumSha256: true,
              artwork: {
                select: {
                  title: true,
                  artist: {
                    select: {
                      displayName: true
                    }
                  }
                }
              }
            }
          },
          user: {
            select: {
              email: true
            }
          },
          order: {
            select: {
              id: true
            }
          }
        }
      });
      
      if (!entitlement) {
        return reply.status(404).send({ error: "Digital entitlement not found" });
      }

      // Final validation
      if (entitlement.downloadsCount >= entitlement.maxDownloads) {
        return reply.status(403).send({ error: "Download limit exceeded" });
      }

      if (entitlement.expiresAt && entitlement.expiresAt < new Date()) {
        return reply.status(403).send({ error: "Digital entitlement has expired" });
      }

      if (!entitlement.edition.privateFileKey) {
        return reply.status(404).send({ error: "Digital file not available" });
      }

      // Increment download count in transaction
      try {
        await incrementDownloadCount(fastify.prisma, entitlement.id);
      } catch (error) {
        fastify.log.error("Failed to increment download count:", error as any);
        // Continue with download even if count update fails
      }

      // Remove the token (one-time use)
      downloadTokens.delete(token);

      const bucket = getBucketForScope("DIGITAL_FILE");
      const contentType = entitlement.edition.contentType || "application/octet-stream";
      const filename = `${entitlement.edition.artwork.title}.${contentType.split('/')[1] || 'bin'}`;

      // Check if watermarking is enabled and file is an image
      const watermarkEnabled = process.env.DIGITAL_WATERMARK_ENABLED === "true";
      const isImage = contentType.startsWith("image/");

      if (watermarkEnabled && isImage) {
        try {
          // Apply watermark to image
          const imageStream = await storage.getObjectStream(entitlement.edition.privateFileKey, bucket);
          
          // Read stream into buffer
          const chunks: Buffer[] = [];
          for await (const chunk of imageStream) {
            chunks.push(chunk as Buffer);
          }
          const imageBuffer = Buffer.concat(chunks);

          // Create watermark text
          const watermarkText = process.env.DIGITAL_WATERMARK_TEXT || "Purchased via ArtFromRomania";
          const includeEmail = process.env.DIGITAL_WATERMARK_INCLUDE_EMAIL === "true";
          const opacity = parseFloat(process.env.DIGITAL_WATERMARK_OPACITY || "0.25");
          
          let fullWatermarkText = watermarkText;
          if (includeEmail && entitlement.user.email) {
            fullWatermarkText += `\n${entitlement.user.email}`;
          }
          fullWatermarkText += `\nOrder #${entitlement.order.id}`;
          fullWatermarkText += `\n${new Date().toLocaleDateString()}`;

          // Apply watermark using sharp
          const watermarkedBuffer = await sharp(imageBuffer)
            .composite([{
              input: Buffer.from(
                `<svg width="400" height="120">
                  <style>
                    .watermark { 
                      font: 14px Arial; 
                      fill: rgba(255, 255, 255, ${opacity}); 
                      text-anchor: end;
                    }
                  </style>
                  <text x="390" y="20" class="watermark">${fullWatermarkText.split('\n').map((line, i) => 
                    `<tspan x="390" dy="${i * 18}">${line}</tspan>`
                  ).join('')}</text>
                </svg>`
              ),
              gravity: 'southeast'
            }])
            .toBuffer();

          // Set headers
          reply.header('Content-Type', contentType);
          reply.header('Content-Disposition', `attachment; filename="${filename}"`);
          reply.header('Cache-Control', 'no-store');
          reply.header('Content-Length', watermarkedBuffer.length);

          return reply.send(watermarkedBuffer);

        } catch (watermarkError) {
          fastify.log.error("Watermark failed, serving original:", watermarkError as any);
          // Fall through to serve original file
        }
      }

      // Serve original file (no watermark or watermark failed)
      try {
        const fileStream = await storage.getObjectStream(entitlement.edition.privateFileKey, bucket);
        
        // Set headers
        reply.header('Content-Type', contentType);
        reply.header('Content-Disposition', `attachment; filename="${filename}"`);
        reply.header('Cache-Control', 'no-store');
        
        if (entitlement.edition.fileBytes) {
          reply.header('Content-Length', entitlement.edition.fileBytes.toString());
        }

        return reply.send(fileStream);

      } catch (streamError) {
        fastify.log.error("Failed to stream file:", streamError as any);
        return reply.status(500).send({ error: "Failed to download file" });
      }

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: "Download failed" });
    }
  });
}
