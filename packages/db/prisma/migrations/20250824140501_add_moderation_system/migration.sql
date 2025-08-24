/*
  Warnings:

  - You are about to drop the column `actorUserId` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `entity` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `audit_logs` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "FulfillmentStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'MATURE');

-- CreateEnum
CREATE TYPE "ContentRating" AS ENUM ('SAFE', 'MATURE', 'PROHIBITED');

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_actorUserId_fkey";

-- AlterTable
ALTER TABLE "artists" ADD COLUMN     "banReason" TEXT,
ADD COLUMN     "banned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shadowbanned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trustScore" INTEGER NOT NULL DEFAULT 50;

-- AlterTable
ALTER TABLE "artworks" ADD COLUMN     "contentRating" "ContentRating" NOT NULL DEFAULT 'SAFE',
ADD COLUMN     "flaggedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastReviewedAt" TIMESTAMP(3),
ADD COLUMN     "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "suppressed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "audit_logs" DROP COLUMN "actorUserId",
DROP COLUMN "entity",
DROP COLUMN "metadata",
ADD COLUMN     "actorId" TEXT,
ADD COLUMN     "data" JSONB,
ADD COLUMN     "entityType" TEXT,
ADD COLUMN     "ip" TEXT,
ADD COLUMN     "userAgent" TEXT,
ALTER COLUMN "entityId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "images" ADD COLUMN     "isPrintMaster" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "fulfillment_orders" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerOrderId" TEXT,
    "status" "FulfillmentStatus" NOT NULL DEFAULT 'DRAFT',
    "shippingMethod" TEXT,
    "costAmount" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "trackingNumbers" JSONB,
    "rawPayload" JSONB,
    "assignedToUserId" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "qcPassedAt" TIMESTAMP(3),
    "labelsStorageKey" TEXT,
    "jobTicketKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fulfillment_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fulfillment_items" (
    "id" TEXT NOT NULL,
    "fulfillmentId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "editionId" TEXT,
    "quantity" INTEGER NOT NULL,
    "material" TEXT,
    "sizeName" TEXT,
    "widthCm" DECIMAL(65,30),
    "heightCm" DECIMAL(65,30),
    "sourceImageKey" TEXT,
    "providerSku" TEXT,

    CONSTRAINT "fulfillment_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_items" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "status" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "autoSignals" JSONB,
    "reviewerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moderation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_actions" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fulfillment_orders_orderId_status_idx" ON "fulfillment_orders"("orderId", "status");

-- CreateIndex
CREATE INDEX "moderation_items_entityType_status_createdAt_idx" ON "moderation_items"("entityType", "status", "createdAt");

-- CreateIndex
CREATE INDEX "reports_entityType_entityId_status_createdAt_idx" ON "reports"("entityType", "entityId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "artworks_moderationStatus_suppressed_contentRating_idx" ON "artworks"("moderationStatus", "suppressed", "contentRating");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_action_createdAt_idx" ON "audit_logs"("actorId", "action", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_createdAt_idx" ON "audit_logs"("entityType", "entityId", "createdAt");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fulfillment_orders" ADD CONSTRAINT "fulfillment_orders_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fulfillment_items" ADD CONSTRAINT "fulfillment_items_fulfillmentId_fkey" FOREIGN KEY ("fulfillmentId") REFERENCES "fulfillment_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fulfillment_items" ADD CONSTRAINT "fulfillment_items_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "moderation_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
