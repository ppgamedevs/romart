-- CreateEnum
CREATE TYPE "public"."SearchBoostScope" AS ENUM ('GLOBAL', 'MEDIUM', 'ARTIST', 'ARTWORK', 'TAG');

-- AlterTable
ALTER TABLE "public"."search_items" ADD COLUMN     "boostScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "minPriceMinor" INTEGER;

-- CreateTable
CREATE TABLE "public"."search_synonyms" (
    "id" TEXT NOT NULL,
    "canonical" TEXT NOT NULL,
    "variants" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_synonyms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."search_boost_rules" (
    "id" TEXT NOT NULL,
    "scope" "public"."SearchBoostScope" NOT NULL,
    "medium" "public"."ProductMedium",
    "artistId" TEXT,
    "artworkId" TEXT,
    "tag" TEXT,
    "weight" DOUBLE PRECISION NOT NULL,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_boost_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "search_synonyms_canonical_key" ON "public"."search_synonyms"("canonical");
