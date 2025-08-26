-- CreateEnum
CREATE TYPE "public"."InteractionKind" AS ENUM ('VIEW', 'FAVORITE', 'ADD_TO_CART', 'PURCHASE');

-- CreateTable
CREATE TABLE "public"."interactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "artworkId" TEXT NOT NULL,
    "kind" "public"."InteractionKind" NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."similar_artworks" (
    "artworkId" TEXT NOT NULL,
    "similarId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "similar_artworks_pkey" PRIMARY KEY ("artworkId","similarId")
);

-- CreateTable
CREATE TABLE "public"."trending_daily" (
    "day" TIMESTAMP(3) NOT NULL,
    "artworkId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "trending_daily_pkey" PRIMARY KEY ("day","artworkId")
);

-- CreateTable
CREATE TABLE "public"."user_preferences" (
    "userId" TEXT NOT NULL,
    "topMediums" TEXT[],
    "priceP50" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "interactions_artworkId_createdAt_idx" ON "public"."interactions"("artworkId", "createdAt");

-- CreateIndex
CREATE INDEX "interactions_userId_createdAt_idx" ON "public"."interactions"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "similar_artworks_artworkId_score_idx" ON "public"."similar_artworks"("artworkId", "score");

-- CreateIndex
CREATE INDEX "trending_daily_day_score_idx" ON "public"."trending_daily"("day", "score");
