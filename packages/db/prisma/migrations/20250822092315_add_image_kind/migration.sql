-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "KycDocumentType" AS ENUM ('ID_CARD', 'PASSPORT', 'DRIVER_LICENSE', 'OTHER');

-- CreateEnum
CREATE TYPE "ImageKind" AS ENUM ('ARTWORK', 'AVATAR', 'COVER', 'KYC');

-- AlterTable
ALTER TABLE "artists" ADD COLUMN     "completionScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "kycStatus" "KycStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "onboardingStep" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "slugLockedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "images" ADD COLUMN     "artistId" TEXT,
ADD COLUMN     "contentType" TEXT,
ADD COLUMN     "kind" "ImageKind" NOT NULL DEFAULT 'ARTWORK',
ADD COLUMN     "sizeBytes" INTEGER,
ADD COLUMN     "storageKey" TEXT,
ADD COLUMN     "variantMeta" JSONB,
ALTER COLUMN "artworkId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "kyc_verifications" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "status" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL DEFAULT 'MANUAL',
    "country" TEXT NOT NULL,
    "documentType" "KycDocumentType" NOT NULL,
    "docLast4" TEXT,
    "frontImageUrl" TEXT,
    "backImageUrl" TEXT,
    "selfieImageUrl" TEXT,
    "notes" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kyc_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kyc_verifications_artistId_key" ON "kyc_verifications"("artistId");

-- CreateIndex
CREATE INDEX "kyc_verifications_status_createdAt_idx" ON "kyc_verifications"("status", "createdAt");

-- CreateIndex
CREATE INDEX "images_artworkId_createdAt_idx" ON "images"("artworkId", "createdAt");

-- CreateIndex
CREATE INDEX "images_artistId_kind_idx" ON "images"("artistId", "kind");

-- AddForeignKey
ALTER TABLE "images" ADD CONSTRAINT "images_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_verifications" ADD CONSTRAINT "kyc_verifications_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
