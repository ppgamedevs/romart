-- CreateEnum
CREATE TYPE "public"."CampaignScope" AS ENUM ('GLOBAL', 'MEDIUM', 'ARTIST', 'ARTWORK', 'EDITION_KIND');

-- CreateEnum
CREATE TYPE "public"."EditionKind" AS ENUM ('ORIGINAL', 'CANVAS', 'METAL', 'PHOTO');

-- CreateTable
CREATE TABLE "public"."campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope" "public"."CampaignScope" NOT NULL,
    "medium" "public"."ProductMedium",
    "artistId" TEXT,
    "artworkId" TEXT,
    "editionKind" "public"."EditionKind",
    "pct" DOUBLE PRECISION,
    "addMinor" INTEGER,
    "priority" INTEGER NOT NULL DEFAULT 50,
    "stackable" BOOLEAN NOT NULL DEFAULT false,
    "maxDiscountMinor" INTEGER,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "ogBadge" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);
