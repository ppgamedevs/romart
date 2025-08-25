import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@artfromromania/db";
import { slugify } from "@artfromromania/shared";

const LocalizeArtistSchema = z.object({
  locale: z.enum(["en", "ro"]),
  displayName: z.string().optional(),
  bio: z.string().optional(),
  slug: z.string().optional(),
});

const LocalizeArtworkSchema = z.object({
  locale: z.enum(["en", "ro"]),
  title: z.string().optional(),
  description: z.string().optional(),
  slug: z.string().optional(),
});

export async function localizationRoutes(fastify: FastifyInstance) {
  // Localize artist content
  fastify.post("/studio/artist/:id/localize", {
    schema: {
      params: z.object({ id: z.string() }),
      body: LocalizeArtistSchema,
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { locale, displayName, bio, slug } = request.body as z.infer<typeof LocalizeArtistSchema>;
    const user = request.user;

    if (!user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const artist = await prisma.artist.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!artist) {
      return reply.status(404).send({ error: "Artist not found" });
    }

    if (user.role !== "ADMIN" && artist.userId !== user.id) {
      return reply.status(403).send({ error: "Forbidden" });
    }

    // Validate slug uniqueness if provided
    if (slug) {
      const existingArtist = await prisma.artist.findFirst({
        where: {
          OR: [
            { slugEn: slug },
            { slugRo: slug }
          ],
          id: { not: id }
        }
      });

      if (existingArtist) {
        return reply.status(400).send({ error: "Slug already exists" });
      }
    }

    // Get current localized data
    const currentLocalized = await prisma.artist.findUnique({
      where: { id },
      select: { displayNameLocalized: true, bioLocalized: true }
    });

    // Update localized fields
    const updateData: any = {};
    
    if (displayName !== undefined) {
      updateData.displayNameLocalized = {
        ...(currentLocalized?.displayNameLocalized as Record<string, string> || {}),
        [locale]: displayName
      };
    }

    if (bio !== undefined) {
      updateData.bioLocalized = {
        ...(currentLocalized?.bioLocalized as Record<string, string> || {}),
        [locale]: bio
      };
    }

    if (slug) {
      if (locale === "en") {
        updateData.slugEn = slug;
      } else {
        updateData.slugRo = slug;
      }
    }

    const updatedArtist = await prisma.artist.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        displayName: true,
        displayNameLocalized: true,
        bio: true,
        bioLocalized: true,
        slugEn: true,
        slugRo: true,
      }
    });

    return { success: true, artist: updatedArtist };
  });

  // Localize artwork content
  fastify.post("/studio/artwork/:id/localize", {
    schema: {
      params: z.object({ id: z.string() }),
      body: LocalizeArtworkSchema,
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { locale, title, description, slug } = request.body as z.infer<typeof LocalizeArtworkSchema>;
    const user = request.user;

    if (!user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const artwork = await prisma.artwork.findUnique({
      where: { id },
      include: { artist: { select: { userId: true } } }
    });

    if (!artwork) {
      return reply.status(404).send({ error: "Artwork not found" });
    }

    if (user.role !== "ADMIN" && artwork.artist.userId !== user.id) {
      return reply.status(403).send({ error: "Forbidden" });
    }

    // Validate slug uniqueness if provided
    if (slug) {
      const existingArtwork = await prisma.artwork.findFirst({
        where: {
          OR: [
            { slugEn: slug },
            { slugRo: slug }
          ],
          id: { not: id }
        }
      });

      if (existingArtwork) {
        return reply.status(400).send({ error: "Slug already exists" });
      }
    }

    // Get current localized data
    const currentLocalized = await prisma.artwork.findUnique({
      where: { id },
      select: { titleLocalized: true, descriptionLocalized: true }
    });

    // Update localized fields
    const updateData: any = {};
    
    if (title !== undefined) {
      updateData.titleLocalized = {
        ...(currentLocalized?.titleLocalized as Record<string, string> || {}),
        [locale]: title
      };
    }

    if (description !== undefined) {
      updateData.descriptionLocalized = {
        ...(currentLocalized?.descriptionLocalized as Record<string, string> || {}),
        [locale]: description
      };
    }

    if (slug) {
      if (locale === "en") {
        updateData.slugEn = slug;
      } else {
        updateData.slugRo = slug;
      }
    }

    const updatedArtwork = await prisma.artwork.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        titleLocalized: true,
        description: true,
        descriptionLocalized: true,
        slugEn: true,
        slugRo: true,
      }
    });

    return { success: true, artwork: updatedArtwork };
  });

  // Generate slug for artist
  fastify.post("/studio/artist/:id/generate-slug", {
    schema: {
      params: z.object({ id: z.string() }),
      body: z.object({ locale: z.enum(["en", "ro"]), displayName: z.string() }),
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { locale, displayName } = request.body as { locale: "en" | "ro"; displayName: string };
    const user = request.user;

    if (!user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const artist = await prisma.artist.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!artist) {
      return reply.status(404).send({ error: "Artist not found" });
    }

    if (user.role !== "ADMIN" && artist.userId !== user.id) {
      return reply.status(403).send({ error: "Forbidden" });
    }

    let baseSlug = slugify(displayName);
    let slug = baseSlug;
    let counter = 1;

    // Check for uniqueness
    while (true) {
      const existingArtist = await prisma.artist.findFirst({
        where: {
          OR: [
            { slugEn: slug },
            { slugRo: slug }
          ],
          id: { not: id }
        }
      });

      if (!existingArtist) {
        break;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return { slug };
  });

  // Generate slug for artwork
  fastify.post("/studio/artwork/:id/generate-slug", {
    schema: {
      params: z.object({ id: z.string() }),
      body: z.object({ locale: z.enum(["en", "ro"]), title: z.string() }),
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { locale, title } = request.body as { locale: "en" | "ro"; title: string };
    const user = request.user;

    if (!user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const artwork = await prisma.artwork.findUnique({
      where: { id },
      include: { artist: { select: { userId: true } } }
    });

    if (!artwork) {
      return reply.status(404).send({ error: "Artwork not found" });
    }

    if (user.role !== "ADMIN" && artwork.artist.userId !== user.id) {
      return reply.status(403).send({ error: "Forbidden" });
    }

    let baseSlug = slugify(title);
    let slug = baseSlug;
    let counter = 1;

    // Check for uniqueness
    while (true) {
      const existingArtwork = await prisma.artwork.findFirst({
        where: {
          OR: [
            { slugEn: slug },
            { slugRo: slug }
          ],
          id: { not: id }
        }
      });

      if (!existingArtwork) {
        break;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return { slug };
  });
}
