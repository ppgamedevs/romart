/*
  Warnings:

  - You are about to drop the column `coverKey` on the `curated_collections` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `curated_collections` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."AnalyticsEventType" AS ENUM ('VIEW_ARTWORK', 'SAVE_ARTWORK', 'SHARE_ARTWORK', 'ADD_TO_CART', 'CHECKOUT_START', 'PURCHASED');

-- AlterTable
ALTER TABLE "public"."collection_items" ADD COLUMN     "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "sortIndex" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."curated_collections" DROP COLUMN "coverKey",
ADD COLUMN     "coverImageUrl" TEXT,
ADD COLUMN     "curatorId" TEXT,
ADD COLUMN     "heroTone" TEXT NOT NULL DEFAULT 'DARK',
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "sortIndex" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "subtitle" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "title" SET DATA TYPE TEXT,
ALTER COLUMN "description" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "public"."analytics_events" (
    "id" TEXT NOT NULL,
    "type" "public"."AnalyticsEventType" NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "sessionId" TEXT,
    "artistId" TEXT,
    "artworkId" TEXT,
    "collectionId" TEXT,
    "referrer" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "country" TEXT,
    "device" TEXT,
    "priceMinor" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analytics_events_artistId_ts_idx" ON "public"."analytics_events"("artistId", "ts");

-- CreateIndex
CREATE INDEX "analytics_events_artworkId_ts_idx" ON "public"."analytics_events"("artworkId", "ts");

-- CreateIndex
CREATE INDEX "analytics_events_type_ts_idx" ON "public"."analytics_events"("type", "ts");

-- CreateIndex
CREATE INDEX "collection_items_collectionId_sortIndex_idx" ON "public"."collection_items"("collectionId", "sortIndex");

-- CreateIndex
CREATE INDEX "curated_collections_isFeatured_sortIndex_idx" ON "public"."curated_collections"("isFeatured", "sortIndex");

-- AddForeignKey
ALTER TABLE "public"."curated_collections" ADD CONSTRAINT "curated_collections_curatorId_fkey" FOREIGN KEY ("curatorId") REFERENCES "public"."curator_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
