/*
  Warnings:

  - Added the required column `userId` to the `digital_entitlements` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "digital_entitlements" ADD COLUMN     "downloadsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "lastDownloadedAt" TIMESTAMP(3),
ADD COLUMN     "maxDownloads" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "editions" ADD COLUMN     "checksumSha256" TEXT,
ADD COLUMN     "contentType" TEXT,
ADD COLUMN     "fileBytes" INTEGER,
ADD COLUMN     "privateFileKey" TEXT;

-- CreateIndex
CREATE INDEX "digital_entitlements_userId_createdAt_idx" ON "digital_entitlements"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "digital_entitlements" ADD CONSTRAINT "digital_entitlements_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_entitlements" ADD CONSTRAINT "digital_entitlements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_entitlements" ADD CONSTRAINT "digital_entitlements_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "editions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
