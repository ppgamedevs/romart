import { FastifyInstance } from "fastify";
import { z } from "zod";
// Use fastify-decorated prisma instance
import { createRateLimiter } from "../utils/rateLimiter";
import { maskContacts } from "../utils/contactMasking";

const CreateInquirySchema = z.object({
  type: z.enum(["QUESTION", "COMMISSION"]),
  artistId: z.string(),
  artworkId: z.string().optional(),
  email: z.string().email(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  dimensions: z.string().optional(),
  deadlineAt: z.string().datetime().optional(),
  notes: z.string().optional(),
  files: z.array(z.string()).optional(),
});

const UpdateStatusSchema = z.object({
  status: z.enum([
    "NEW", "QUALIFIED", "AWAITING_ARTIST", "QUOTE_SENT", 
    "DEPOSIT_PAID", "IN_PROGRESS", "PROOF_REVIEW", 
    "DELIVERED", "WON", "LOST", "CANCELED"
  ]),
});

const CreateMessageSchema = z.object({
  role: z.enum(["CURATOR", "ARTIST"]),
  body: z.string(),
});

const CreateQuoteSchema = z.object({
  currency: z.string().default("EUR"),
  subtotal: z.number(),
  taxAmount: z.number().default(0),
  depositBps: z.number().default(3000),
  terms: z.string().optional(),
});

const CreateMilestonesSchema = z.object({
  milestones: z.array(z.object({
    title: z.string(),
    amount: z.number(),
  })),
});

export async function inquiryRoutes(fastify: FastifyInstance) {
  const { prisma } = fastify;
  // Rate limiter for inquiries
  const inquiryRateLimiter = createRateLimiter(
    "inquiries", 
    Number(process.env.INQUIRY_RATE_PER_HOUR || 10), 
    3600
  );

  // Create new inquiry (public)
  fastify.post("/inquiries", {
    schema: {
      body: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["QUESTION", "COMMISSION"] },
          artistId: { type: "string" },
          artworkId: { type: "string" },
          email: { type: "string", format: "email" },
          budgetMin: { type: "number" },
          budgetMax: { type: "number" },
          dimensions: { type: "string" },
          deadlineAt: { type: "string", format: "date-time" },
          notes: { type: "string" },
          files: { type: "array", items: { type: "string" } }
        },
        required: ["type", "artistId", "email"]
      },
    },
  }, async (request, reply) => {
    const body = request.body as z.infer<typeof CreateInquirySchema>;
    const clientIp = request.ip || "unknown";

    // Rate limiting
    try {
      await inquiryRateLimiter(request, reply);
    } catch (error) {
      return; // Rate limiter already sent response
    }

    // Validate artist exists
    const artist = await prisma.artist.findUnique({
      where: { id: body.artistId },
      select: { id: true, userId: true }
    });

    if (!artist) {
      return reply.status(404).send({ error: "Artist not found" });
    }

    // Mask contacts in notes if enabled
    let maskedNotes = body.notes;
    if (process.env.MASK_CONTACTS_ENABLED === "true" && body.notes) {
      maskedNotes = maskContacts(body.notes);
    }

    // Find available curator (round-robin)
    const curators = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
      take: 10
    });

    const curatorId = curators.length > 0 ? curators[0].id : null;

    // Create inquiry
    const inquiry = await prisma.inquiry.create({
      data: {
        type: body.type,
        clientEmail: body.email,
        artistId: body.artistId,
        artworkId: body.artworkId,
        budgetMin: body.budgetMin,
        budgetMax: body.budgetMax,
        dimensions: body.dimensions,
        deadlineAt: body.deadlineAt ? new Date(body.deadlineAt) : null,
        notes: maskedNotes,
        curatorId,
        locale: "en", // TODO: detect from request
      },
      include: {
        artist: {
          select: {
            displayName: true,
            user: { select: { email: true } }
          }
        }
      }
    });

    // Create initial system message
    await prisma.inquiryMessage.create({
      data: {
        inquiryId: inquiry.id,
        role: "SYSTEM",
        body: `New ${body.type.toLowerCase()} inquiry created`,
      }
    });

    return { success: true, inquiryId: inquiry.id };
  });

  // Get inquiries (curator/admin)
  fastify.get("/studio/inquiries", {
    preHandler: async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: "Unauthorized" });
      }
      if (request.user.role !== "ADMIN") {
        return reply.status(403).send({ error: "Forbidden" });
      }
    }
  }, async (request, reply) => {
    const { status, artistId, q } = request.query as any;
    
    const where: any = {};
    if (status) where.status = status;
    if (artistId) where.artistId = artistId;
    if (q) {
      where.OR = [
        { notes: { contains: q, mode: "insensitive" } },
        { artist: { displayName: { contains: q, mode: "insensitive" } } }
      ];
    }

    const inquiries = await prisma.inquiry.findMany({
      where,
      include: {
        artist: {
          select: {
            displayName: true,
            avatarUrl: true
          }
        },
        artwork: {
          select: {
            title: true,
            heroImageUrl: true
          }
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1
        },
        _count: {
          select: {
            messages: true,
            files: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return { inquiries };
  });

  // Get inquiry details
  fastify.get("/studio/inquiries/:id", {
    preHandler: async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: "Unauthorized" });
      }
      if (request.user.role !== "ADMIN") {
        return reply.status(403).send({ error: "Forbidden" });
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: {
        artist: {
          select: {
            displayName: true,
            avatarUrl: true,
            user: { select: { email: true } }
          }
        },
        artwork: {
          select: {
            title: true,
            heroImageUrl: true
          }
        },
        messages: {
          orderBy: { createdAt: "asc" }
        },
        files: {
          orderBy: { createdAt: "desc" }
        },
        quote: true,
        milestones: {
          orderBy: { createdAt: "asc" }
        }
      }
    });

    if (!inquiry) {
      return reply.status(404).send({ error: "Inquiry not found" });
    }

    return { inquiry };
  });

  // Add message to inquiry
  fastify.post("/studio/inquiries/:id/message", {
    schema: {
      body: {
        type: "object",
        properties: {
          role: { type: "string", enum: ["CURATOR", "ARTIST"] },
          body: { type: "string" }
        },
        required: ["role", "body"]
      },
    },
    preHandler: async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: "Unauthorized" });
      }
      if (request.user.role !== "ADMIN") {
        return reply.status(403).send({ error: "Forbidden" });
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { role, body } = request.body as z.infer<typeof CreateMessageSchema>;

    // Mask contacts in message
    let maskedBody = body;
    if (process.env.MASK_CONTACTS_ENABLED === "true") {
      maskedBody = maskContacts(body);
    }

    const message = await prisma.inquiryMessage.create({
      data: {
        inquiryId: id,
        role,
        body: maskedBody,
      }
    });

    return { success: true, message };
  });

  // Update inquiry status
  fastify.post("/studio/inquiries/:id/status", {
    schema: {
      body: {
        type: "object",
        properties: {
          status: { 
            type: "string", 
            enum: ["NEW", "QUALIFIED", "AWAITING_ARTIST", "QUOTE_SENT", "DEPOSIT_PAID", "IN_PROGRESS", "PROOF_REVIEW", "DELIVERED", "WON", "LOST", "CANCELED"]
          }
        },
        required: ["status"]
      },
    },
    preHandler: async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: "Unauthorized" });
      }
      if (request.user.role !== "ADMIN") {
        return reply.status(403).send({ error: "Forbidden" });
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as z.infer<typeof UpdateStatusSchema>;

    const inquiry = await prisma.inquiry.update({
      where: { id },
      data: { status },
      include: {
        artist: {
          select: {
            displayName: true,
            user: { select: { email: true } }
          }
        }
      }
    });

    // Add system message for status change
    await prisma.inquiryMessage.create({
      data: {
        inquiryId: id,
        role: "SYSTEM",
        body: `Status changed to ${status}`,
      }
    });

    return { success: true, inquiry };
  });

  // Create/update quote
  fastify.post("/studio/inquiries/:id/quote", {
    schema: {
      body: {
        type: "object",
        properties: {
          currency: { type: "string", default: "EUR" },
          subtotal: { type: "number" },
          taxAmount: { type: "number", default: 0 },
          depositBps: { type: "number", default: 3000 },
          terms: { type: "string" }
        },
        required: ["subtotal"]
      },
    },
    preHandler: async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: "Unauthorized" });
      }
      if (request.user.role !== "ADMIN") {
        return reply.status(403).send({ error: "Forbidden" });
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as z.infer<typeof CreateQuoteSchema>;

    // Generate quote number
    const quoteNumber = `Q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const quote = await prisma.commissionQuote.upsert({
      where: { inquiryId: id },
      update: {
        currency: body.currency,
        subtotal: body.subtotal,
        taxAmount: body.taxAmount,
        total: body.subtotal + body.taxAmount,
        depositBps: body.depositBps,
        terms: body.terms,
      },
      create: {
        inquiryId: id,
        number: quoteNumber,
        currency: body.currency,
        subtotal: body.subtotal,
        taxAmount: body.taxAmount,
        total: body.subtotal + body.taxAmount,
        depositBps: body.depositBps,
        terms: body.terms,
      }
    });

    return { success: true, quote };
  });

  // Create milestones
  fastify.post("/studio/inquiries/:id/milestones", {
    schema: {
      body: {
        type: "object",
        properties: {
          milestones: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                amount: { type: "number" }
              },
              required: ["title", "amount"]
            }
          }
        },
        required: ["milestones"]
      },
    },
    preHandler: async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: "Unauthorized" });
      }
      if (request.user.role !== "ADMIN") {
        return reply.status(403).send({ error: "Forbidden" });
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { milestones } = request.body as z.infer<typeof CreateMilestonesSchema>;

    // Delete existing milestones
    await prisma.commissionMilestone.deleteMany({
      where: { inquiryId: id }
    });

    // Create new milestones
    const createdMilestones = await prisma.commissionMilestone.createMany({
      data: milestones.map(m => ({
        inquiryId: id,
        title: m.title,
        amount: m.amount,
        currency: "EUR", // TODO: get from inquiry
      }))
    });

    return { success: true, milestones: createdMilestones };
  });

  // Close inquiry
  fastify.post("/studio/inquiries/:id/close", {
    schema: {
      body: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["WON", "LOST", "CANCELED"] }
        },
        required: ["status"]
      },
    },
    preHandler: async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: "Unauthorized" });
      }
      if (request.user.role !== "ADMIN") {
        return reply.status(403).send({ error: "Forbidden" });
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: "WON" | "LOST" | "CANCELED" };

    const inquiry = await prisma.inquiry.update({
      where: { id },
      data: { status }
    });

    // Add system message
    await prisma.inquiryMessage.create({
      data: {
        inquiryId: id,
        role: "SYSTEM",
        body: `Inquiry closed with status: ${status}`,
      }
    });

    return { success: true, inquiry };
  });
}
