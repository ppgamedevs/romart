-- CreateEnum
CREATE TYPE "public"."ProductMedium" AS ENUM ('PAINTING', 'DRAWING', 'PHOTOGRAPHY', 'DIGITAL');

-- CreateEnum
CREATE TYPE "public"."ProductType" AS ENUM ('ORIGINAL', 'PRINT');

-- AlterTable
ALTER TABLE "public"."artworks" ADD COLUMN     "currency" TEXT DEFAULT 'EUR',
ADD COLUMN     "onSale" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priceMinor" INTEGER,
ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "saleMinor" INTEGER,
ADD COLUMN     "weightKg" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "public"."editions" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "editionSize" INTEGER,
ADD COLUMN     "kind" TEXT,
ADD COLUMN     "onSale" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priceMinor" INTEGER,
ADD COLUMN     "saleMinor" INTEGER,
ADD COLUMN     "sizeLabel" TEXT;

-- CreateTable
CREATE TABLE "public"."price_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "medium" "public"."ProductMedium",
    "artworkId" TEXT,
    "editionId" TEXT,
    "pct" DOUBLE PRECISION,
    "addMinor" INTEGER,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "stackable" BOOLEAN NOT NULL DEFAULT false,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_rules_pkey" PRIMARY KEY ("id")
);
