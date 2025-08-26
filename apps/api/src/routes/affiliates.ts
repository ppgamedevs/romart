import { Router } from 'express';
import { z } from 'zod';
import { db } from '@romart/db';
import { createHash } from 'crypto';
import { rateLimit } from '@romart/auth';
import { validateRequest } from '../lib/validate';
import { getServerSession } from '@romart/auth';

const router = Router();

// =============================================================================
// Helper Functions
// =============================================================================

function hashIpAndUa(ip: string, userAgent: string, day: string): string {
  return createHash('sha256')
    .update(`${ip}${userAgent}${day}`)
    .digest('hex');
}

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function calcCommission(subtotalMinor: number, bps: number, capMinor: number): number {
  const raw = Math.round(subtotalMinor * (bps / 10000));
  return Math.min(raw, capMinor);
}

// =============================================================================
// Public Routes
// =============================================================================

// GET /aff/resolve - Resolve referral code and return redirect info
const resolveSchema = z.object({
  code: z.string().min(1),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_content: z.string().optional(),
  utm_term: z.string().optional(),
});

router.get('/resolve', validateRequest({ query: resolveSchema }), async (req, res) => {
  try {
    const { code, ...utm } = req.query as z.infer<typeof resolveSchema>;
    
    // First try to find a referral link
    let referralLink = await db.referralLink.findUnique({
      where: { code: code.toUpperCase() },
      include: { partner: true }
    });

    // If not found, try creator code
    let creatorCode = null;
    if (!referralLink) {
      creatorCode = await db.creatorCode.findUnique({
        where: { code: code.toUpperCase() },
        include: { partner: true, artist: true }
      });
    }

    if (!referralLink && !creatorCode) {
      return res.status(404).json({ error: 'Referral code not found' });
    }

    // Determine landing page
    let landing = '/';
    if (referralLink?.landing) {
      landing = referralLink.landing;
    } else if (creatorCode?.artist?.slug) {
      landing = `/artist/${creatorCode.artist.slug}`;
    }

    // Log the visit
    const ip = req.ip || req.connection.remoteAddress || '';
    const userAgent = req.get('User-Agent') || '';
    const day = new Date().toISOString().split('T')[0];
    const ipHash = hashIpAndUa(ip, userAgent, day);

    const utmData = Object.keys(utm).length > 0 ? utm : null;

    await db.referralVisit.create({
      data: {
        linkId: referralLink?.id,
        codeId: creatorCode?.id,
        ipHash,
        uaHash: createHash('sha256').update(userAgent).digest('hex'),
        source: utm.utm_source || null,
        utm: utmData,
      }
    });

    // Check if user has consented to cookies
    const hasConsent = req.headers['x-cmp-analytics'] === 'true' || 
                      req.cookies?.cmp_analytics === 'true';

    const response: any = { landing };

    if (hasConsent) {
      response.setCookie = {
        name: process.env.AFFIL_COOKIE_NAME || 'romart_aff',
        value: referralLink ? `link:${referralLink.id}` : `code:${creatorCode!.id}`,
        days: parseInt(process.env.AFFIL_COOKIE_DAYS || '30')
      };
    }

    res.json(response);
  } catch (error) {
    console.error('Error resolving referral code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /aff/attribution - Save attribution for users without cookie consent
const attributionSchema = z.object({
  code: z.string().min(1),
  type: z.enum(['link', 'code']),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_content: z.string().optional(),
  utm_term: z.string().optional(),
});

router.post('/attribution', validateRequest({ body: attributionSchema }), async (req, res) => {
  try {
    const { code, type, ...utm } = req.body as z.infer<typeof attributionSchema>;
    
    // This would typically save to Redis for the fallback period
    // For now, we'll just acknowledge it
    const utmData = Object.keys(utm).length > 0 ? utm : null;
    
    // In a real implementation, you'd save this to Redis with TTL
    // redis.setex(`attribution:${sessionId}`, fallbackMinutes * 60, JSON.stringify({ code, type, utm: utmData }))
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving attribution:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =============================================================================
// Checkout Integration
// =============================================================================

// POST /checkout/apply-code - Apply creator code to cart
const applyCodeSchema = z.object({
  code: z.string().min(1),
});

router.post('/checkout/apply-code', validateRequest({ body: applyCodeSchema }), async (req, res) => {
  try {
    const { code } = req.body as z.infer<typeof applyCodeSchema>;
    
    const creatorCode = await db.creatorCode.findUnique({
      where: { 
        code: code.toUpperCase(),
        active: true 
      },
      include: { partner: true, artist: true }
    });

    if (!creatorCode) {
      return res.status(404).json({ error: 'Invalid or inactive creator code' });
    }

    // Return code info for frontend to apply discount
    res.json({
      code: creatorCode.code,
      discountBps: creatorCode.discountBps,
      discountPercent: creatorCode.discountBps / 100,
      partnerName: creatorCode.partner?.name || creatorCode.artist?.displayName,
      codeId: creatorCode.id
    });
  } catch (error) {
    console.error('Error applying creator code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =============================================================================
// Conversion Processing (called from webhook)
// =============================================================================

// POST /aff/conversion - Process order conversion
const conversionSchema = z.object({
  orderId: z.string(),
  subtotalMinor: z.number(),
  currency: z.string(),
  userId: z.string().optional(),
  appliedCodeId: z.string().optional(),
});

router.post('/conversion', validateRequest({ body: conversionSchema }), async (req, res) => {
  try {
    const { orderId, subtotalMinor, currency, userId, appliedCodeId } = req.body as z.infer<typeof conversionSchema>;
    
    // Check for existing conversion (dedupe)
    const existing = await db.referralConversion.findUnique({
      where: { orderId }
    });
    
    if (existing) {
      return res.json({ success: true, message: 'Conversion already processed' });
    }

    let conversion = null;
    let kind: 'AFFILIATE' | 'CREATOR' = 'AFFILIATE';

    // Priority 1: Creator code applied at checkout
    if (appliedCodeId) {
      const creatorCode = await db.creatorCode.findUnique({
        where: { id: appliedCodeId, active: true },
        include: { partner: true, artist: true }
      });

      if (creatorCode) {
        // Anti-fraud: Check for self-referral
        if (userId && (creatorCode.artistId === userId || creatorCode.partner?.userId === userId)) {
          conversion = await db.referralConversion.create({
            data: {
              orderId,
              codeId: creatorCode.id,
              kind: 'CREATOR',
              currency,
              subtotalMinor,
              commissionMinor: 0,
              status: 'VOID',
              reason: 'Self-referral detected'
            }
          });
        } else {
          const bonusMinor = calcCommission(
            subtotalMinor, 
            creatorCode.bonusBps, 
            parseInt(process.env.AFFIL_MAX_COMMISSION_EUR || '50000')
          );

          conversion = await db.referralConversion.create({
            data: {
              orderId,
              partnerId: creatorCode.partnerId || creatorCode.artistId,
              codeId: creatorCode.id,
              kind: 'CREATOR',
              currency,
              subtotalMinor,
              commissionMinor: bonusMinor,
              status: 'APPROVED'
            }
          });
        }
      }
    }

    // Priority 2: Affiliate link from cookie/session
    if (!conversion) {
      // In a real implementation, you'd check cookies and session store
      // For now, we'll skip affiliate attribution if creator code was used
    }

    res.json({ 
      success: true, 
      conversion: conversion ? {
        id: conversion.id,
        status: conversion.status,
        commissionMinor: conversion.commissionMinor
      } : null
    });
  } catch (error) {
    console.error('Error processing conversion:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =============================================================================
// Admin Routes
// =============================================================================

// Admin authentication middleware
async function requireAdmin(request: any, reply: any) {
  // TODO: Implement proper admin authentication
  // For now, we'll use a simple check
  const isAdmin = request.headers["x-admin-token"] === "admin-secret";
  if (!isAdmin) {
    return reply.status(403).send({ error: "Admin access required" });
  }
}

// POST /admin/partners - Create a new partner
const createPartnerSchema = z.object({
  name: z.string().min(1),
  kind: z.enum(["AFFILIATE", "CREATOR"]).default("AFFILIATE"),
  slug: z.string().min(1),
  defaultBps: z.number().min(0).max(10000).default(1000),
  connectId: z.string().optional(),
});

router.post("/admin/partners", { preHandler: [requireAdmin] }, async (req, res) => {
  try {
    const data = req.body as z.infer<typeof createPartnerSchema>;
    
    // Check if slug is unique
    const existingPartner = await db.partner.findUnique({
      where: { slug: data.slug }
    });
    
    if (existingPartner) {
      return res.status(400).json({ error: "Partner slug already exists" });
    }
    
    const partner = await db.partner.create({
      data: {
        name: data.name,
        kind: data.kind,
        slug: data.slug,
        defaultBps: data.defaultBps,
        connectId: data.connectId,
      }
    });
    
    res.json({ success: true, partner });
  } catch (error) {
    console.error("Error creating partner:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/partners - List all partners
router.get("/admin/partners", { preHandler: [requireAdmin] }, async (req, res) => {
  try {
    const { status, kind, page = 1, limit = 20 } = req.query as any;
    
    const where: any = {};
    if (status) where.status = status;
    if (kind) where.kind = kind;
    
    const skip = (page - 1) * limit;
    
    const [partners, total] = await Promise.all([
      db.partner.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, name: true }
          },
          links: {
            select: { id: true, code: true, landing: true }
          },
          codes: {
            select: { id: true, code: true, active: true }
          },
          conversions: {
            select: { 
              id: true, 
              status: true, 
              commissionMinor: true,
              createdAt: true 
            }
          },
          payouts: {
            select: { 
              id: true, 
              amountMinor: true, 
              createdAt: true 
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      db.partner.count({ where })
    ]);
    
    res.json({
      success: true,
      partners,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching partners:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /admin/partners/:id/link - Create a referral link for a partner
const createLinkSchema = z.object({
  landing: z.string().optional(),
});

router.post("/admin/partners/:id/link", { preHandler: [requireAdmin] }, async (req, res) => {
  try {
    const { id } = req.params;
    const { landing } = req.body as z.infer<typeof createLinkSchema>;
    
    const partner = await db.partner.findUnique({
      where: { id }
    });
    
    if (!partner) {
      return res.status(404).json({ error: "Partner not found" });
    }
    
    const code = generateReferralCode();
    
    const link = await db.referralLink.create({
      data: {
        partnerId: id,
        code,
        landing: landing || "/",
      }
    });
    
    res.json({ success: true, link });
  } catch (error) {
    console.error("Error creating referral link:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/conversions - List all conversions
router.get("/admin/conversions", { preHandler: [requireAdmin] }, async (req, res) => {
  try {
    const { status, partnerId, from, to, page = 1, limit = 20 } = req.query as any;
    
    const where: any = {};
    if (status) where.status = status;
    if (partnerId) where.partnerId = partnerId;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }
    
    const skip = (page - 1) * limit;
    
    const [conversions, total] = await Promise.all([
      db.referralConversion.findMany({
        where,
        include: {
          partner: {
            select: { id: true, name: true, slug: true }
          },
          link: {
            select: { id: true, code: true }
          },
          code: {
            select: { id: true, code: true }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      db.referralConversion.count({ where })
    ]);
    
    res.json({
      success: true,
      conversions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching conversions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /admin/conversions/:id/void - Void a conversion
router.post("/admin/conversions/:id/void", { preHandler: [requireAdmin] }, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body as { reason?: string };
    
    const conversion = await db.referralConversion.findUnique({
      where: { id }
    });
    
    if (!conversion) {
      return res.status(404).json({ error: "Conversion not found" });
    }
    
    if (conversion.status === "PAID") {
      return res.status(400).json({ error: "Cannot void paid conversion" });
    }
    
    await db.referralConversion.update({
      where: { id },
      data: {
        status: "VOID",
        reason: reason || "Voided by admin"
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error voiding conversion:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/payouts - List all payouts
router.get("/admin/payouts", { preHandler: [requireAdmin] }, async (req, res) => {
  try {
    const { partnerId, from, to, page = 1, limit = 20 } = req.query as any;
    
    const where: any = {};
    if (partnerId) where.partnerId = partnerId;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }
    
    const skip = (page - 1) * limit;
    
    const [payouts, total] = await Promise.all([
      db.commissionPayout.findMany({
        where,
        include: {
          partner: {
            select: { id: true, name: true, slug: true }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      db.commissionPayout.count({ where })
    ]);
    
    res.json({
      success: true,
      payouts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching payouts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// =============================================================================
// Monthly Payout Cron Job
// =============================================================================

// POST /admin/payouts/run - Run monthly payout processing
router.post("/admin/payouts/run", { preHandler: [requireAdmin] }, async (req, res) => {
  try {
    const { token } = req.headers as any;
    
    // Simple token validation for cron jobs
    if (token !== process.env.ADMIN_CRON_TOKEN) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized"
      });
    }
    
    // Import the payout processing function
    const { processAffiliatePayouts } = await import("../payments/connect");
    
    const result = await processAffiliatePayouts();
    
    res.json({
      success: true,
      processed: result.processed,
      totalAmount: result.totalAmount,
      errors: result.errors
    });
  } catch (error) {
    console.error("Error processing payouts:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process payouts"
    });
  }
});

// GET /admin/stats - Get affiliate system statistics
router.get("/admin/stats", { preHandler: [requireAdmin] }, async (req, res) => {
  try {
    const { from, to } = req.query as any;
    
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const toDate = to ? new Date(to) : new Date();
    
    const [
      totalPartners,
      activePartners,
      totalConversions,
      totalCommission,
      pendingCommission,
      totalPayouts,
      totalPayoutAmount,
      recentVisits
    ] = await Promise.all([
      db.partner.count(),
      db.partner.count({ where: { status: "ACTIVE" } }),
      db.referralConversion.count({
        where: {
          createdAt: { gte: fromDate, lte: toDate }
        }
      }),
      db.referralConversion.aggregate({
        where: {
          createdAt: { gte: fromDate, lte: toDate },
          status: { in: ["APPROVED", "PAID"] }
        },
        _sum: { commissionMinor: true }
      }),
      db.referralConversion.aggregate({
        where: {
          status: "APPROVED"
        },
        _sum: { commissionMinor: true }
      }),
      db.commissionPayout.count({
        where: {
          createdAt: { gte: fromDate, lte: toDate }
        }
      }),
      db.commissionPayout.aggregate({
        where: {
          createdAt: { gte: fromDate, lte: toDate }
        },
        _sum: { amountMinor: true }
      }),
      db.referralVisit.count({
        where: {
          createdAt: { gte: fromDate, lte: toDate }
        }
      })
    ]);
    
    res.json({
      success: true,
      stats: {
        totalPartners,
        activePartners,
        totalConversions,
        totalCommission: totalCommission._sum.commissionMinor || 0,
        pendingCommission: pendingCommission._sum.commissionMinor || 0,
        totalPayouts,
        totalPayoutAmount: totalPayoutAmount._sum.amountMinor || 0,
        recentVisits,
        period: {
          from: fromDate,
          to: toDate
        }
      }
    });
  } catch (error) {
    console.error("Error fetching affiliate stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// =============================================================================
// Studio Routes (for artists)
// =============================================================================

// GET /studio/creator-codes - List artist's creator codes
router.get('/studio/creator-codes', rateLimit({ windowMs: 60 * 1000, max: 20 }), async (req, res) => {
  try {
    const session = await getServerSession(req);
    if (!session?.user || session.user.role !== 'ARTIST') {
      return res.status(403).json({ error: 'Artist access required' });
    }

    const codes = await db.creatorCode.findMany({
      where: { artistId: session.user.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ codes });
  } catch (error) {
    console.error('Error fetching creator codes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /studio/creator-codes - Create new creator code
const createCodeSchema = z.object({
  code: z.string().min(3).max(10),
  discountBps: z.number().min(0).max(5000), // 0-50%
  bonusBps: z.number().min(0).max(5000), // 0-50%
});

router.post('/studio/creator-codes', rateLimit({ windowMs: 60 * 1000, max: 10 }), validateRequest({ body: createCodeSchema }), async (req, res) => {
  try {
    const session = await getServerSession(req);
    if (!session?.user || session.user.role !== 'ARTIST') {
      return res.status(403).json({ error: 'Artist access required' });
    }

    const { code, discountBps, bonusBps } = req.body as z.infer<typeof createCodeSchema>;

    // Check code limit
    const existingCodes = await db.creatorCode.count({
      where: { artistId: session.user.id }
    });

    const maxCodes = parseInt(process.env.CREATOR_CODE_MAX_PER_ARTIST || '5');
    if (existingCodes >= maxCodes) {
      return res.status(400).json({ error: `Maximum ${maxCodes} creator codes allowed` });
    }

    // Check if code already exists
    const existingCode = await db.creatorCode.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (existingCode) {
      return res.status(400).json({ error: 'Creator code already exists' });
    }

    const creatorCode = await db.creatorCode.create({
      data: {
        artistId: session.user.id,
        code: code.toUpperCase(),
        discountBps,
        bonusBps
      }
    });

    res.json({ creatorCode });
  } catch (error) {
    console.error('Error creating creator code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =============================================================================
// Dashboard Routes
// =============================================================================

// GET /me/aff/dashboard - Affiliate dashboard
router.get('/me/aff/dashboard', rateLimit({ windowMs: 60 * 1000, max: 20 }), async (req, res) => {
  try {
    const session = await getServerSession(req);
    if (!session?.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get partner info
    const partner = await db.partner.findFirst({
      where: { userId: session.user.id },
      include: {
        links: {
          include: {
            _count: {
              select: { visits: true, conversions: true }
            }
          }
        },
        codes: {
          include: {
            _count: {
              select: { conversions: true }
            }
          }
        },
        _count: {
          select: { payouts: true }
        }
      }
    });

    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    // Get recent conversions
    const recentConversions = await db.referralConversion.findMany({
      where: { partnerId: partner.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Calculate stats
    const totalConversions = await db.referralConversion.count({
      where: { 
        partnerId: partner.id,
        status: { in: ['APPROVED', 'PAID'] }
      }
    });

    const totalCommission = await db.referralConversion.aggregate({
      where: { 
        partnerId: partner.id,
        status: { in: ['APPROVED', 'PAID'] }
      },
      _sum: { commissionMinor: true }
    });

    res.json({
      partner,
      stats: {
        totalConversions,
        totalCommission: totalCommission._sum.commissionMinor || 0,
        recentConversions
      }
    });
  } catch (error) {
    console.error('Error fetching affiliate dashboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
