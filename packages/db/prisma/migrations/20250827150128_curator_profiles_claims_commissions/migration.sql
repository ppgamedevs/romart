-- CreateEnum
CREATE TYPE "public"."TicketType" AS ENUM ('GENERAL_INQUIRY', 'ARTWORK_QUESTION', 'TECHNICAL_SUPPORT', 'BILLING_QUESTION', 'ARTIST_SUPPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."TicketStatus" AS ENUM ('OPEN', 'ASSIGNED', 'WAITING_CUSTOMER', 'WAITING_ARTIST', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."TicketPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."TicketSource" AS ENUM ('WEB_FORM', 'EMAIL', 'PHONE', 'CHAT', 'API');

-- CreateEnum
CREATE TYPE "public"."PayoutMethod" AS ENUM ('STRIPE_CONNECT', 'MANUAL_CSV');

-- CreateEnum
CREATE TYPE "public"."PayoutBatchStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'PARTIAL', 'FAILED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."CommissionStatus" ADD VALUE 'EARNED';
ALTER TYPE "public"."CommissionStatus" ADD VALUE 'REVERSED';

-- AlterEnum
ALTER TYPE "public"."PayoutStatus" ADD VALUE 'PROCESSING';

-- AlterEnum
ALTER TYPE "public"."UserRole" ADD VALUE 'CURATOR';

-- CreateTable
CREATE TABLE "public"."curator_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "tagline" TEXT,
    "bio" TEXT,
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "socials" JSONB,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sortIndex" INTEGER NOT NULL DEFAULT 0,
    "onlineAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "payoutMethod" "public"."PayoutMethod" NOT NULL DEFAULT 'STRIPE_CONNECT',
    "stripeAccountId" TEXT,
    "payoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "payoutCurrency" TEXT NOT NULL DEFAULT 'EUR',

    CONSTRAINT "curator_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."curator_stats" (
    "id" TEXT NOT NULL,
    "curatorId" TEXT NOT NULL,
    "ticketsClaimed" INTEGER NOT NULL DEFAULT 0,
    "ticketsResolved" INTEGER NOT NULL DEFAULT 0,
    "avgFirstResponseMin" DOUBLE PRECISION,
    "commissionMinorEarned" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "curator_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tickets" (
    "id" TEXT NOT NULL,
    "type" "public"."TicketType" NOT NULL,
    "status" "public"."TicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "public"."TicketPriority" NOT NULL DEFAULT 'NORMAL',
    "subject" TEXT NOT NULL,
    "customerId" TEXT,
    "artistId" TEXT,
    "artworkId" TEXT,
    "curatorId" TEXT,
    "curatorLockedToId" TEXT,
    "claimLockedUntil" TIMESTAMP(3),
    "source" "public"."TicketSource" NOT NULL DEFAULT 'WEB_FORM',
    "payload" JSONB,
    "firstResponseAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "snoozedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."messages" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."curator_commissions" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "curatorId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "basisMinor" INTEGER NOT NULL,
    "pct" DOUBLE PRECISION NOT NULL,
    "commissionMinor" INTEGER NOT NULL,
    "status" "public"."CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "earnedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "payoutId" TEXT,

    CONSTRAINT "curator_commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."curator_payout_batches" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "method" "public"."PayoutMethod" NOT NULL,
    "periodFrom" TIMESTAMP(3) NOT NULL,
    "periodTo" TIMESTAMP(3) NOT NULL,
    "totalMinor" INTEGER NOT NULL DEFAULT 0,
    "count" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."PayoutBatchStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "curator_payout_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."curator_payouts" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "curatorId" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "public"."PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "transferId" TEXT,

    CONSTRAINT "curator_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "curator_profiles_userId_key" ON "public"."curator_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "curator_profiles_slug_key" ON "public"."curator_profiles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "curator_profiles_stripeAccountId_key" ON "public"."curator_profiles"("stripeAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "curator_stats_curatorId_key" ON "public"."curator_stats"("curatorId");

-- CreateIndex
CREATE UNIQUE INDEX "curator_payout_batches_label_key" ON "public"."curator_payout_batches"("label");

-- AddForeignKey
ALTER TABLE "public"."curator_profiles" ADD CONSTRAINT "curator_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."curator_stats" ADD CONSTRAINT "curator_stats_curatorId_fkey" FOREIGN KEY ("curatorId") REFERENCES "public"."curator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tickets" ADD CONSTRAINT "tickets_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tickets" ADD CONSTRAINT "tickets_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "public"."artists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tickets" ADD CONSTRAINT "tickets_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "public"."artworks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tickets" ADD CONSTRAINT "tickets_curatorId_fkey" FOREIGN KEY ("curatorId") REFERENCES "public"."curator_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tickets" ADD CONSTRAINT "tickets_curatorLockedToId_fkey" FOREIGN KEY ("curatorLockedToId") REFERENCES "public"."curator_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "public"."tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."curator_commissions" ADD CONSTRAINT "curator_commissions_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "public"."tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."curator_commissions" ADD CONSTRAINT "curator_commissions_curatorId_fkey" FOREIGN KEY ("curatorId") REFERENCES "public"."curator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."curator_commissions" ADD CONSTRAINT "curator_commissions_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "public"."curator_payouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."curator_payouts" ADD CONSTRAINT "curator_payouts_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "public"."curator_payout_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."curator_payouts" ADD CONSTRAINT "curator_payouts_curatorId_fkey" FOREIGN KEY ("curatorId") REFERENCES "public"."curator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
