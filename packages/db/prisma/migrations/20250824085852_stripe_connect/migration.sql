/*
  Warnings:

  - A unique constraint covering the columns `[stripeAccountId]` on the table `artists` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "PayoutStatus" ADD VALUE 'REVERSED';

-- AlterTable
ALTER TABLE "artists" ADD COLUMN     "connectRequirements" JSONB,
ADD COLUMN     "connectStatus" TEXT,
ADD COLUMN     "payoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripeAccountId" TEXT;

-- AlterTable
ALTER TABLE "payouts" ADD COLUMN     "availableAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "artists_stripeAccountId_key" ON "artists"("stripeAccountId");
