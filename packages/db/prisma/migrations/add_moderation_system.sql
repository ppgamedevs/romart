-- Add moderation enums
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'MATURE');
CREATE TYPE "ContentRating" AS ENUM ('SAFE', 'MATURE', 'PROHIBITED');

-- Add moderation fields to Artist table
ALTER TABLE "artists" ADD COLUMN "banned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "artists" ADD COLUMN "banReason" TEXT;
ALTER TABLE "artists" ADD COLUMN "shadowbanned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "artists" ADD COLUMN "trustScore" INTEGER NOT NULL DEFAULT 50;

-- Add moderation fields to Artwork table
ALTER TABLE "artworks" ADD COLUMN "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "artworks" ADD COLUMN "contentRating" "ContentRating" NOT NULL DEFAULT 'SAFE';
ALTER TABLE "artworks" ADD COLUMN "flaggedCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "artworks" ADD COLUMN "lastReviewedAt" TIMESTAMP(3);
ALTER TABLE "artworks" ADD COLUMN "suppressed" BOOLEAN NOT NULL DEFAULT false;

-- Create indexes for Artwork moderation
CREATE INDEX "artworks_moderation_idx" ON "artworks"("moderationStatus", "suppressed", "contentRating");

-- Create ModerationItem table
CREATE TABLE "ModerationItem" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "status" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "autoSignals" JSONB,
    "reviewerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModerationItem_pkey" PRIMARY KEY ("id")
);

-- Create indexes for ModerationItem
CREATE INDEX "ModerationItem_entityType_status_createdAt_idx" ON "ModerationItem"("entityType", "status", "createdAt");

-- Create ModerationAction table
CREATE TABLE "ModerationAction" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationAction_pkey" PRIMARY KEY ("id")
);

-- Create Report table
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- Create indexes for Report
CREATE INDEX "Report_entityType_entityId_status_createdAt_idx" ON "Report"("entityType", "entityId", "status", "createdAt");

-- Update existing AuditLog table
ALTER TABLE "audit_logs" ADD COLUMN "entityType" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN "ip" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN "userAgent" TEXT;
ALTER TABLE "audit_logs" RENAME COLUMN "metadata" TO "data";
ALTER TABLE "audit_logs" RENAME COLUMN "actorUserId" TO "actorId";

-- Create indexes for AuditLog
CREATE INDEX "AuditLog_actorId_action_createdAt_idx" ON "audit_logs"("actorId", "action", "createdAt");
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "audit_logs"("entityType", "entityId", "createdAt");
