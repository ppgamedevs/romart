import { FastifyInstance } from "fastify";
import { prisma } from "@artfromromania/db";
import { z } from "zod";
import { QAScanner, QAAlertService } from "@artfromromania/qa";
import { getConfigFromEnv } from "@artfromromania/qa/src/utils";

function requireAdmin(req: any) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token !== process.env.ADMIN_TOKEN) {
    throw new Error('Unauthorized');
  }
}

export default async function routes(app: FastifyInstance) {
  // Manual scan trigger
  app.post("/admin/qa/scan", async (req, res) => {
    requireAdmin(req);
    
    const S = z.object({
      type: z.enum(["images", "collections", "content", "all"]).default("all"),
      batchSize: z.number().optional(),
      concurrency: z.number().optional()
    });
    
    const body = S.parse(req.body || {});
    
    const scanner = new QAScanner(prisma, {
      batchSize: body.batchSize,
      concurrency: body.concurrency
    });
    
    const alertService = new QAAlertService();
    
    const results: any = {};
    
    try {
      if (body.type === "all" || body.type === "images") {
        results.images = await scanner.scanArtworkImages();
        await alertService.sendScanSummary("Artwork Images", results.images);
      }
      
      if (body.type === "all" || body.type === "collections") {
        results.collections = await scanner.scanCollections();
        await alertService.sendScanSummary("Collections", results.collections);
      }
      
      if (body.type === "all" || body.type === "content") {
        results.content = await scanner.scanContentIssues();
        await alertService.sendScanSummary("Content Issues", results.content);
      }
      
      res.send({ success: true, results });
    } catch (error) {
      console.error('QA scan error:', error);
      res.status(500).send({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Get QA issues with filtering
  app.get("/admin/qa/issues", async (req, res) => {
    requireAdmin(req);
    
    const S = z.object({
      status: z.enum(["OPEN", "RESOLVED", "IGNORED"]).optional(),
      severity: z.enum(["WARNING", "ERROR", "CRITICAL"]).optional(),
      code: z.string().optional(),
      artworkId: z.string().optional(),
      artistId: z.string().optional(),
      collectionId: z.string().optional(),
      page: z.number().default(1),
      pageSize: z.number().default(20)
    });
    
    const query = S.parse(req.query || {});
    const skip = (query.page - 1) * query.pageSize;
    
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.severity) where.severity = query.severity;
    if (query.code) where.code = query.code;
    if (query.artworkId) where.artworkId = query.artworkId;
    if (query.artistId) where.artistId = query.artistId;
    if (query.collectionId) where.collectionId = query.collectionId;
    
    const [issues, total] = await Promise.all([
      prisma.qAIssue.findMany({
        where,
        orderBy: [
          { severity: 'desc' },
          { lastSeen: 'desc' }
        ],
        skip,
        take: query.pageSize,
        include: {
          artwork: {
            select: {
              title: true,
              slug: true,
              artist: {
                select: {
                  displayName: true,
                  slug: true
                }
              }
            }
          },
          collection: {
            select: {
              title: true,
              slug: true
            }
          }
        }
      }),
      prisma.qAIssue.count({ where })
    ]);
    
    res.send({
      issues,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize)
      }
    });
  });

  // Update issue status
  app.post("/admin/qa/issues/:id/status", async (req, res) => {
    requireAdmin(req);
    
    const S = z.object({
      status: z.enum(["OPEN", "RESOLVED", "IGNORED"]),
      resolution: z.string().optional()
    });
    
    const params = z.object({
      id: z.string()
    }).parse(req.params);
    
    const body = S.parse(req.body || {});
    
    const updateData: any = {
      status: body.status,
      lastSeen: new Date()
    };
    
    if (body.status === "RESOLVED") {
      updateData.resolvedAt = new Date();
      updateData.resolution = body.resolution || "Manually resolved";
    }
    
    const issue = await prisma.qAIssue.update({
      where: { id: params.id },
      data: updateData
    });
    
    res.send({ success: true, issue });
  });

  // Re-check specific issue
  app.post("/admin/qa/issues/:id/recheck", async (req, res) => {
    requireAdmin(req);
    
    const params = z.object({
      id: z.string()
    }).parse(req.params);
    
    const issue = await prisma.qAIssue.findUnique({
      where: { id: params.id }
    });
    
    if (!issue) {
      return res.status(404).send({ error: "Issue not found" });
    }
    
    const scanner = new QAScanner(prisma);
    
    try {
      // Re-check based on issue type
      if (issue.imageUrl) {
        // Re-check image
        const probeResult = await scanner['probeImageWithTimeout'](
          issue.imageUrl,
          getConfigFromEnv().scan.timeoutMs,
          getConfigFromEnv().scan.retryAttempts
        );
        
        // If no issues detected, resolve the issue
        const issues = scanner['detectImageIssues'](probeResult, issue.imageUrl);
        if (issues.length === 0) {
          await prisma.qAIssue.update({
            where: { id: params.id },
            data: {
              status: "RESOLVED",
              resolvedAt: new Date(),
              resolution: "Issue resolved on re-check"
            }
          });
        }
      }
      
      res.send({ success: true, message: "Re-check completed" });
    } catch (error) {
      res.status(500).send({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Re-check failed' 
      });
    }
  });

  // Auto-resolve old issues
  app.post("/admin/qa/auto-resolve", async (req, res) => {
    requireAdmin(req);
    
    const S = z.object({
      daysOld: z.number().default(7)
    });
    
    const body = S.parse(req.body || {});
    
    const scanner = new QAScanner(prisma);
    const resolvedCount = await scanner.autoResolveOldIssues(body.daysOld);
    
    res.send({ 
      success: true, 
      resolvedCount,
      message: `Auto-resolved ${resolvedCount} issues older than ${body.daysOld} days`
    });
  });

  // Get QA statistics
  app.get("/admin/qa/stats", async (req, res) => {
    requireAdmin(req);
    
    const [
      totalIssues,
      openIssues,
      issuesBySeverity,
      issuesByCode,
      recentIssues
    ] = await Promise.all([
      prisma.qAIssue.count(),
      prisma.qAIssue.count({ where: { status: "OPEN" } }),
      prisma.qAIssue.groupBy({
        by: ["severity"],
        where: { status: "OPEN" },
        _count: true
      }),
      prisma.qAIssue.groupBy({
        by: ["code"],
        where: { status: "OPEN" },
        _count: true
      }),
      prisma.qAIssue.count({
        where: {
          firstSeen: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })
    ]);
    
    res.send({
      totalIssues,
      openIssues,
      issuesBySeverity: issuesBySeverity.reduce((acc, item) => {
        acc[item.severity] = item._count;
        return acc;
      }, {} as Record<string, number>),
      issuesByCode: issuesByCode.reduce((acc, item) => {
        acc[item.code] = item._count;
        return acc;
      }, {} as Record<string, number>),
      recentIssues
    });
  });
}
