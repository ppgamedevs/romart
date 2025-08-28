-- CreateEnum
CREATE TYPE "public"."PriceRounding" AS ENUM ('NONE', 'END_00', 'END_90', 'END_99');

-- CreateTable
CREATE TABLE "public"."print_base_costs" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "sizeLabel" TEXT NOT NULL,
    "baseMinor" INTEGER NOT NULL,
    "packagingMinor" INTEGER NOT NULL DEFAULT 0,
    "leadDays" INTEGER NOT NULL DEFAULT 5,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "print_base_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."artist_pricing_profiles" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "printMarkupPct" DOUBLE PRECISION,
    "canvasMarkupPct" DOUBLE PRECISION,
    "metalMarkupPct" DOUBLE PRECISION,
    "photoMarkupPct" DOUBLE PRECISION,
    "minMarginPct" DOUBLE PRECISION,
    "rounding" "public"."PriceRounding" NOT NULL DEFAULT 'END_00',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artist_pricing_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "print_base_costs_kind_sizeLabel_key" ON "public"."print_base_costs"("kind", "sizeLabel");

-- CreateIndex
CREATE UNIQUE INDEX "artist_pricing_profiles_artistId_key" ON "public"."artist_pricing_profiles"("artistId");
