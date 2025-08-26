-- CreateEnum
CREATE TYPE "ReferralKind" AS ENUM ('AFFILIATE', 'CREATOR');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('ACTIVE', 'PAUSED', 'BANNED');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'APPROVED', 'PAYABLE', 'PAID', 'VOID');

-- AlterEnum
ALTER TYPE "NotifTopic" ADD VALUE 'AFFILIATE';

-- CreateTable
CREATE TABLE "partners" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "kind" "ReferralKind" NOT NULL DEFAULT 'AFFILIATE',
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'ACTIVE',
    "defaultBps" INTEGER NOT NULL DEFAULT 1000,
    "connectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_links" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "landing" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_codes" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT,
    "artistId" TEXT,
    "code" TEXT NOT NULL,
    "discountBps" INTEGER NOT NULL DEFAULT 1000,
    "bonusBps" INTEGER NOT NULL DEFAULT 500,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_visits" (
    "id" TEXT NOT NULL,
    "linkId" TEXT,
    "codeId" TEXT,
    "ipHash" TEXT,
    "uaHash" TEXT,
    "source" TEXT,
    "utm" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_conversions" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "partnerId" TEXT,
    "linkId" TEXT,
    "codeId" TEXT,
    "kind" "ReferralKind" NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "subtotalMinor" INTEGER NOT NULL,
    "commissionMinor" INTEGER NOT NULL DEFAULT 0,
    "eurMinor" INTEGER,
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_conversions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_payouts" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "stripePayoutId" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commission_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "partners_slug_key" ON "partners"("slug");

-- CreateIndex
CREATE INDEX "partners_userId_idx" ON "partners"("userId");

-- CreateIndex
CREATE INDEX "partners_status_idx" ON "partners"("status");

-- CreateIndex
CREATE UNIQUE INDEX "referral_links_code_key" ON "referral_links"("code");

-- CreateIndex
CREATE INDEX "referral_links_partnerId_idx" ON "referral_links"("partnerId");

-- CreateIndex
CREATE INDEX "referral_links_code_idx" ON "referral_links"("code");

-- CreateIndex
CREATE UNIQUE INDEX "creator_codes_code_key" ON "creator_codes"("code");

-- CreateIndex
CREATE INDEX "creator_codes_partnerId_idx" ON "creator_codes"("partnerId");

-- CreateIndex
CREATE INDEX "creator_codes_artistId_idx" ON "creator_codes"("artistId");

-- CreateIndex
CREATE INDEX "creator_codes_code_idx" ON "creator_codes"("code");

-- CreateIndex
CREATE INDEX "referral_visits_linkId_idx" ON "referral_visits"("linkId");

-- CreateIndex
CREATE INDEX "referral_visits_codeId_idx" ON "referral_visits"("codeId");

-- CreateIndex
CREATE INDEX "referral_visits_ipHash_uaHash_createdAt_idx" ON "referral_visits"("ipHash", "uaHash", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "referral_conversions_orderId_key" ON "referral_conversions"("orderId");

-- CreateIndex
CREATE INDEX "referral_conversions_partnerId_idx" ON "referral_conversions"("partnerId");

-- CreateIndex
CREATE INDEX "referral_conversions_linkId_idx" ON "referral_conversions"("linkId");

-- CreateIndex
CREATE INDEX "referral_conversions_codeId_idx" ON "referral_conversions"("codeId");

-- CreateIndex
CREATE INDEX "referral_conversions_status_idx" ON "referral_conversions"("status");

-- CreateIndex
CREATE INDEX "referral_conversions_createdAt_idx" ON "referral_conversions"("createdAt");

-- CreateIndex
CREATE INDEX "commission_payouts_partnerId_idx" ON "commission_payouts"("partnerId");

-- CreateIndex
CREATE INDEX "commission_payouts_stripePayoutId_idx" ON "commission_payouts"("stripePayoutId");

-- AddForeignKey
ALTER TABLE "partners" ADD CONSTRAINT "partners_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_links" ADD CONSTRAINT "referral_links_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_codes" ADD CONSTRAINT "creator_codes_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_codes" ADD CONSTRAINT "creator_codes_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_visits" ADD CONSTRAINT "referral_visits_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "referral_links"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_visits" ADD CONSTRAINT "referral_visits_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "creator_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_conversions" ADD CONSTRAINT "referral_conversions_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_conversions" ADD CONSTRAINT "referral_conversions_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "referral_links"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_conversions" ADD CONSTRAINT "referral_conversions_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "creator_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_payouts" ADD CONSTRAINT "commission_payouts_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
