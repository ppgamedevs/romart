import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@artfromromania/db";
// Temporary tax functions
async function validateVat(country: string, vatId: string): Promise<any> {
  return { valid: true, checkedAt: new Date() };
}

function validateVatFallback(country: string, vatId: string): any {
  return { valid: true, checkedAt: new Date() };
}

const validateVatSchema = z.object({
  country: z.string().length(2),
  vatId: z.string().min(1)
});

export async function taxRoutes(fastify: FastifyInstance) {
  // POST /tax/validate-vat
  fastify.post("/validate-vat", {
    schema: {
      body: {
        type: "object",
        properties: {
          country: { type: "string", minLength: 2, maxLength: 2 },
          vatId: { type: "string", minLength: 1 }
        },
        required: ["country", "vatId"]
      }
    }
  }, async (request, reply) => {
    const body = validateVatSchema.parse(request.body);
    const { country, vatId } = body;

    try {
      // Check cache first
      const cached = await prisma.vatValidationCache.findUnique({
        where: {
          country_vatId: {
            country: country.toUpperCase(),
            vatId: vatId.toUpperCase()
          }
        }
      });

      // If cached and less than 24 hours old, return cached result
      if (cached && cached.checkedAt > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
        return {
          valid: cached.valid,
          name: cached.name,
          address: cached.address,
          checkedAt: cached.checkedAt,
          cached: true
        };
      }

      // Validate VAT
      const viesEnabled = process.env.VIES_ENABLED === "true";
      const validation = viesEnabled 
        ? await validateVat(country, vatId)
        : validateVatFallback(country, vatId);

      // Cache result
      await prisma.vatValidationCache.upsert({
        where: {
          country_vatId: {
            country: country.toUpperCase(),
            vatId: vatId.toUpperCase()
          }
        },
        update: {
          valid: validation.valid,
          name: validation.name,
          address: validation.address,
          checkedAt: validation.checkedAt || new Date()
        },
        create: {
          country: country.toUpperCase(),
          vatId: vatId.toUpperCase(),
          valid: validation.valid,
          name: validation.name,
          address: validation.address,
          checkedAt: validation.checkedAt || new Date()
        }
      });

      return {
        valid: validation.valid,
        name: validation.name,
        address: validation.address,
        checkedAt: validation.checkedAt,
        cached: false
      };
    } catch (error) {
      fastify.log.error("VAT validation error:", error as any);
      return reply.status(500).send({ 
        error: "Failed to validate VAT ID",
        valid: false 
      });
    }
  });
}
