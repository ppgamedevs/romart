import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createHash } from 'crypto';

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
// Fastify Routes
// =============================================================================

export default async function affiliatesRoutes(app: FastifyInstance) {
  // GET /aff/resolve - Resolve referral code and return redirect info
  app.get('/aff/resolve', async (req, res) => {
    try {
      const { code, ...utm } = req.query as any;
      
      if (!code) {
        return res.code(400).send({ error: 'Code is required' });
      }
      
      // First try to find a referral link
      let referralLink = await app.prisma.referralLink.findUnique({
        where: { code: code.toUpperCase() },
        include: { partner: true }
      });

      // If not found, try creator code
      let creatorCode = null;
      if (!referralLink) {
        creatorCode = await app.prisma.creatorCode.findUnique({
          where: { code: code.toUpperCase() },
          include: { partner: true, artist: true }
        });
      }

      if (!referralLink && !creatorCode) {
        return res.code(404).send({ error: 'Referral code not found' });
      }

      // Determine landing page
      let landing = '/';
      if (referralLink?.landing) {
        landing = referralLink.landing;
      } else if (creatorCode?.artist?.name) {
        landing = `/artist/${creatorCode.artist.id}`;
      }

      // Log the visit
      const ip = req.ip || '';
      const userAgent = req.headers['user-agent'] || '';
      const day = new Date().toISOString().split('T')[0];
      const ipHash = hashIpAndUa(ip, userAgent, day);

      const utmData = Object.keys(utm).length > 0 ? utm : null;

      await app.prisma.referralVisit.create({
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
                       req.headers['x-cmp-marketing'] === 'true';

      return res.send({
        landing,
        hasConsent,
        partner: referralLink?.partner || creatorCode?.partner,
        artist: creatorCode?.artist,
        codeType: referralLink ? 'link' : 'creator'
      });
    } catch (error) {
      app.log.error(error);
      return res.code(500).send({ error: 'Internal server error' });
    }
  });

  // POST /aff/conversion - Track conversion when order is completed
  app.post('/aff/conversion', async (req, res) => {
    try {
      const { orderId, userId, subtotalMinor, currency, partnerId, linkId, codeId } = req.body as any;
      
      if (!orderId || !subtotalMinor || !currency) {
        return res.code(400).send({ error: 'Missing required fields' });
      }

      // Find the referral visit for this order
      const visit = await app.prisma.referralVisit.findFirst({
        where: {
          OR: [
            { linkId: linkId || undefined },
            { codeId: codeId || undefined }
          ],
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days
          }
        },
        include: {
          link: { include: { partner: true } },
          code: { include: { partner: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!visit) {
        return res.code(404).send({ error: 'No referral visit found' });
      }

      const partner = visit.link?.partner || visit.code?.partner;
      if (!partner) {
        return res.code(400).send({ error: 'No partner found' });
      }

      // Calculate commission
      const commissionMinor = calcCommission(
        subtotalMinor,
        partner.defaultBps,
        50000 // Default cap
      );

      // Create conversion record
      const conversion = await app.prisma.referralConversion.create({
        data: {
          partnerId: partner.id,
          linkId: visit.linkId,
          codeId: visit.codeId,
          orderId,
          kind: 'AFFILIATE',
          subtotalMinor,
          currency,
          commissionMinor,
          status: 'PENDING'
        }
      });

      return res.send({ 
        conversionId: conversion.id,
        commissionMinor,
        status: 'PENDING'
      });
    } catch (error) {
      app.log.error(error);
      return res.code(500).send({ error: 'Internal server error' });
    }
  });

  // GET /aff/partner/:id - Get partner details (for authenticated users)
  app.get('/aff/partner/:id', async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.code(401).send({ error: 'Unauthorized' });
      }

      const { id } = req.params as any;
      
      const partner = await app.prisma.partner.findUnique({
        where: { id },
        include: {
          links: {
            select: {
              id: true,
              code: true,
              landing: true,
              createdAt: true
            }
          },
          codes: {
            select: {
              id: true,
              code: true,
              artist: {
                select: {
                  id: true,
                  name: true
                }
              },
              createdAt: true
            }
          }
        }
      });

      if (!partner) {
        return res.code(404).send({ error: 'Partner not found' });
      }

      // Check if user has access to this partner
      if (partner.userId !== userId) {
        return res.code(403).send({ error: 'Forbidden' });
      }

      return res.send(partner);
    } catch (error) {
      app.log.error(error);
      return res.code(500).send({ error: 'Internal server error' });
    }
  });

  // POST /aff/partner - Create new partner
  app.post('/aff/partner', async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.code(401).send({ error: 'Unauthorized' });
      }

      const { name, commissionBps, commissionCapMinor, currency } = req.body as any;
      
      if (!name || !commissionBps || !currency) {
        return res.code(400).send({ error: 'Missing required fields' });
      }

      const partner = await app.prisma.partner.create({
        data: {
          userId,
          name,
          slug: name.toLowerCase().replace(/\s+/g, '-'),
          defaultBps: commissionBps,
          status: 'ACTIVE'
        }
      });

      return res.code(201).send(partner);
    } catch (error) {
      app.log.error(error);
      return res.code(500).send({ error: 'Internal server error' });
    }
  });

  // POST /aff/link - Create new referral link
  app.post('/aff/link', async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.code(401).send({ error: 'Unauthorized' });
      }

      const { partnerId, name, landing } = req.body as any;
      
      if (!partnerId || !name) {
        return res.code(400).send({ error: 'Missing required fields' });
      }

      // Verify user owns this partner
      const partner = await app.prisma.partner.findUnique({
        where: { id: partnerId }
      });

      if (!partner || partner.userId !== userId) {
        return res.code(403).send({ error: 'Forbidden' });
      }

      const link = await app.prisma.referralLink.create({
        data: {
          partnerId,
          code: generateReferralCode(),
          landing: landing || '/'
        }
      });

      return res.code(201).send(link);
    } catch (error) {
      app.log.error(error);
      return res.code(500).send({ error: 'Internal server error' });
    }
  });

  // POST /aff/code - Create new creator code
  app.post('/aff/code', async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.code(401).send({ error: 'Unauthorized' });
      }

      const { partnerId, artistId, name } = req.body as any;
      
      if (!partnerId || !artistId || !name) {
        return res.code(400).send({ error: 'Missing required fields' });
      }

      // Verify user owns this partner
      const partner = await app.prisma.partner.findUnique({
        where: { id: partnerId }
      });

      if (!partner || partner.userId !== userId) {
        return res.code(403).send({ error: 'Forbidden' });
      }

      const code = await app.prisma.creatorCode.create({
        data: {
          partnerId,
          artistId,
          code: generateReferralCode()
        }
      });

      return res.code(201).send(code);
    } catch (error) {
      app.log.error(error);
      return res.code(500).send({ error: 'Internal server error' });
    }
  });

  // GET /aff/stats - Get partner statistics
  app.get('/aff/stats', async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.code(401).send({ error: 'Unauthorized' });
      }

      const { partnerId, since } = req.query as any;
      
      if (!partnerId) {
        return res.code(400).send({ error: 'Partner ID is required' });
      }

      // Verify user owns this partner
      const partner = await app.prisma.partner.findUnique({
        where: { id: partnerId }
      });

      if (!partner || partner.userId !== userId) {
        return res.code(403).send({ error: 'Forbidden' });
      }

      const sinceDate = since ? new Date(since) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const [visits, conversions, revenue] = await Promise.all([
        app.prisma.referralVisit.count({
          where: {
            OR: [
              { link: { partnerId } },
              { code: { partnerId } }
            ],
            createdAt: { gte: sinceDate }
          }
        }),
        app.prisma.referralConversion.count({
          where: {
            partnerId,
            createdAt: { gte: sinceDate }
          }
        }),
        app.prisma.referralConversion.aggregate({
          where: {
            partnerId,
            createdAt: { gte: sinceDate },
            status: 'APPROVED'
          },
          _sum: {
            subtotalMinor: true,
            commissionMinor: true
          }
        })
      ]);

      return res.send({
        visits,
        conversions,
        revenueMinor: revenue._sum.subtotalMinor || 0,
        commissionMinor: revenue._sum.commissionMinor || 0,
        conversionRate: visits > 0 ? (conversions / visits) * 100 : 0
      });
    } catch (error) {
      app.log.error(error);
      return res.code(500).send({ error: 'Internal server error' });
    }
  });
}
