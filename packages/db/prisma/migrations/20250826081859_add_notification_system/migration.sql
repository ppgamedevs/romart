/*
  Warnings:

  - You are about to drop the column `line1` on the `addresses` table. All the data in the column will be lost.
  - You are about to drop the column `line2` on the `addresses` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slugEn]` on the table `artists` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slugRo]` on the table `artists` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slugEn]` on the table `artworks` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slugRo]` on the table `artworks` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `addressLine1` to the `addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `addresses` table without a default value. This is not possible if the table is not empty.
  - Made the column `postalCode` on table `addresses` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('SHIPPING', 'BILLING');

-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('REQUESTED', 'APPROVED', 'RECEIVED', 'QC_PASSED', 'QC_FAILED', 'RESTOCKED', 'REFUNDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "CreditNoteStatus" AS ENUM ('DRAFT', 'PENDING', 'ISSUED', 'VOID');

-- CreateEnum
CREATE TYPE "DsTaskStatus" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'FAILED', 'EXPIRED', 'CANCELED');

-- CreateEnum
CREATE TYPE "DeletionStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'PROCESSING', 'DONE', 'REJECTED', 'CANCELED');

-- CreateEnum
CREATE TYPE "ConsentKind" AS ENUM ('ANALYTICS', 'MARKETING', 'NECESSARY');

-- CreateEnum
CREATE TYPE "ConsentSource" AS ENUM ('CMP', 'UI', 'BACKOFFICE', 'IMPORT');

-- CreateEnum
CREATE TYPE "LegalKind" AS ENUM ('TOS', 'PRIVACY', 'COOKIES');

-- CreateEnum
CREATE TYPE "InquiryType" AS ENUM ('QUESTION', 'COMMISSION');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'QUALIFIED', 'AWAITING_ARTIST', 'QUOTE_SENT', 'DEPOSIT_PAID', 'IN_PROGRESS', 'PROOF_REVIEW', 'DELIVERED', 'WON', 'LOST', 'CANCELED');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('CLIENT', 'CURATOR', 'ARTIST', 'SYSTEM');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('DUE', 'AUTHORIZED', 'CAPTURED', 'RELEASED', 'CANCELED');

-- CreateEnum
CREATE TYPE "CuratorBadgeKind" AS ENUM ('CURATOR_PICK', 'NEW_ARRIVAL', 'TRENDING', 'LIMITED_LEFT', 'EDITION_SOLD_OUT', 'SHIPS_FROM_RO', 'FEATURED');

-- CreateEnum
CREATE TYPE "NotifTopic" AS ENUM ('AUTH', 'ORDER', 'INVOICE', 'SHIPPING', 'CURATOR', 'COMMISSION', 'PAYOUT', 'CART', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotifChannel" AS ENUM ('EMAIL', 'INAPP');

-- CreateEnum
CREATE TYPE "NotifStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'CANCELED');

-- AlterTable
ALTER TABLE "addresses" DROP COLUMN "line1",
DROP COLUMN "line2",
ADD COLUMN     "addressLine1" TEXT NOT NULL,
ADD COLUMN     "addressLine2" TEXT,
ADD COLUMN     "company" TEXT,
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "phoneEncId" TEXT,
ADD COLUMN     "type" "AddressType" NOT NULL,
ALTER COLUMN "postalCode" SET NOT NULL;

-- AlterTable
ALTER TABLE "artists" ADD COLUMN     "bioLocalized" JSONB,
ADD COLUMN     "displayNameLocalized" JSONB,
ADD COLUMN     "slugEn" TEXT,
ADD COLUMN     "slugRo" TEXT;

-- AlterTable
ALTER TABLE "artworks" ADD COLUMN     "descriptionLocalized" JSONB,
ADD COLUMN     "slugEn" TEXT,
ADD COLUMN     "slugRo" TEXT,
ADD COLUMN     "titleLocalized" JSONB;

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "refundedQty" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "canceledAt" TIMESTAMP(3),
ADD COLUMN     "refundedAmount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "shipments" ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "handedOverAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "anonymizedAt" TIMESTAMP(3),
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletionReason" TEXT,
ADD COLUMN     "emailVerified" TIMESTAMP(3),
ADD COLUMN     "image" TEXT,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "name" DROP NOT NULL;

-- CreateTable
CREATE TABLE "admin_notes" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "returns" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "ReturnStatus" NOT NULL DEFAULT 'REQUESTED',
    "reason" TEXT,
    "approvedBy" TEXT,
    "receivedAt" TIMESTAMP(3),
    "qcNotes" TEXT,
    "outcome" TEXT,
    "customerNotes" TEXT,
    "adminNotes" TEXT,
    "qcPassed" BOOLEAN,
    "qcAt" TIMESTAMP(3),
    "restockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_items" (
    "id" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "reason" TEXT,
    "qcPassed" BOOLEAN,
    "qcNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "return_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "provider" TEXT NOT NULL DEFAULT 'STRIPE',
    "providerRefundId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_notes" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "returnId" TEXT,
    "invoiceId" TEXT,
    "number" TEXT NOT NULL,
    "status" "CreditNoteStatus" NOT NULL DEFAULT 'DRAFT',
    "issuedAt" TIMESTAMP(3),
    "reason" TEXT,
    "subtotalAmount" INTEGER NOT NULL DEFAULT 0,
    "taxAmount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "pdfStorageKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "raw" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consents" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "anonymousId" TEXT,
    "kind" "ConsentKind" NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "source" "ConsentSource" NOT NULL DEFAULT 'CMP',
    "country" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_documents" (
    "id" TEXT NOT NULL,
    "kind" "LegalKind" NOT NULL,
    "version" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legal_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_acceptances" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "docId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legal_acceptances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_export_tasks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "DsTaskStatus" NOT NULL DEFAULT 'PENDING',
    "format" TEXT NOT NULL DEFAULT 'ZIP',
    "storageKey" TEXT,
    "expiresAt" TIMESTAMP(3),
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "data_export_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deletion_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "DeletionStatus" NOT NULL DEFAULT 'REQUESTED',
    "reason" TEXT,
    "tokenHash" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "deletion_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erasure_tombstones" (
    "id" TEXT NOT NULL,
    "emailHash" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,

    CONSTRAINT "erasure_tombstones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pii_ciphers" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "keyVersion" INTEGER NOT NULL,
    "iv" BYTEA NOT NULL,
    "tag" BYTEA NOT NULL,
    "ciphertext" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pii_ciphers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rum_events" (
    "id" TEXT NOT NULL,
    "t" TEXT NOT NULL,
    "v" DOUBLE PRECISION NOT NULL,
    "route" TEXT,
    "url" TEXT,
    "d" TEXT,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rum_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquiries" (
    "id" TEXT NOT NULL,
    "type" "InquiryType" NOT NULL,
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "clientId" TEXT,
    "clientEmail" TEXT,
    "artistId" TEXT NOT NULL,
    "artworkId" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "budgetMin" INTEGER,
    "budgetMax" INTEGER,
    "dimensions" TEXT,
    "deadlineAt" TIMESTAMP(3),
    "notes" TEXT,
    "curatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquiry_messages" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inquiry_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquiry_files" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "mime" TEXT,
    "size" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inquiry_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_quotes" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "subtotal" INTEGER NOT NULL,
    "taxAmount" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "depositBps" INTEGER NOT NULL DEFAULT 3000,
    "terms" TEXT,
    "pdfKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commission_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_milestones" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" "MilestoneStatus" NOT NULL DEFAULT 'DUE',
    "stripePiId" TEXT,
    "capturedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commission_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "artworkId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artwork_stats" (
    "artworkId" TEXT NOT NULL,
    "favoritesCount" INTEGER NOT NULL DEFAULT 0,
    "views24h" INTEGER NOT NULL DEFAULT 0,
    "views7d" INTEGER NOT NULL DEFAULT 0,
    "soldCount" INTEGER NOT NULL DEFAULT 0,
    "countriesCount" INTEGER NOT NULL DEFAULT 0,
    "lastSoldAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artwork_stats_pkey" PRIMARY KEY ("artworkId")
);

-- CreateTable
CREATE TABLE "artist_stats" (
    "artistId" TEXT NOT NULL,
    "followersCount" INTEGER NOT NULL DEFAULT 0,
    "soldCountries" INTEGER NOT NULL DEFAULT 0,
    "totalSold" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artist_stats_pkey" PRIMARY KEY ("artistId")
);

-- CreateTable
CREATE TABLE "curator_badges" (
    "id" TEXT NOT NULL,
    "kind" "CuratorBadgeKind" NOT NULL,
    "artworkId" TEXT NOT NULL,
    "curatorId" TEXT,
    "notes" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "curator_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curated_collections" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" JSONB NOT NULL,
    "description" JSONB,
    "coverKey" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "curated_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_items" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "artworkId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_notif_prefs" (
    "userId" TEXT NOT NULL,
    "emailOrder" BOOLEAN NOT NULL DEFAULT true,
    "emailCurator" BOOLEAN NOT NULL DEFAULT true,
    "emailAuth" BOOLEAN NOT NULL DEFAULT true,
    "emailCart" BOOLEAN NOT NULL DEFAULT true,
    "inappOrder" BOOLEAN NOT NULL DEFAULT true,
    "inappCurator" BOOLEAN NOT NULL DEFAULT true,
    "inappAuth" BOOLEAN NOT NULL DEFAULT true,
    "inappCart" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_notif_prefs_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "topic" "NotifTopic" NOT NULL,
    "channel" "NotifChannel" NOT NULL,
    "template" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "NotifStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "notifId" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerId" TEXT,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_notes_entityType_entityId_createdAt_idx" ON "admin_notes"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "returns_orderId_status_createdAt_idx" ON "returns"("orderId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "refunds_orderId_status_createdAt_idx" ON "refunds"("orderId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "credit_notes_number_key" ON "credit_notes"("number");

-- CreateIndex
CREATE INDEX "credit_notes_orderId_status_createdAt_idx" ON "credit_notes"("orderId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "webhook_events_provider_type_receivedAt_idx" ON "webhook_events"("provider", "type", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "consents_anonymousId_key" ON "consents"("anonymousId");

-- CreateIndex
CREATE INDEX "consents_userId_kind_createdAt_idx" ON "consents"("userId", "kind", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "legal_documents_kind_version_key" ON "legal_documents"("kind", "version");

-- CreateIndex
CREATE INDEX "legal_acceptances_userId_version_idx" ON "legal_acceptances"("userId", "version");

-- CreateIndex
CREATE INDEX "data_export_tasks_userId_status_requestedAt_idx" ON "data_export_tasks"("userId", "status", "requestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "deletion_requests_tokenHash_key" ON "deletion_requests"("tokenHash");

-- CreateIndex
CREATE INDEX "deletion_requests_status_scheduledAt_idx" ON "deletion_requests"("status", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "erasure_tombstones_emailHash_key" ON "erasure_tombstones"("emailHash");

-- CreateIndex
CREATE INDEX "pii_ciphers_entityType_entityId_field_idx" ON "pii_ciphers"("entityType", "entityId", "field");

-- CreateIndex
CREATE INDEX "inquiries_artistId_status_createdAt_idx" ON "inquiries"("artistId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "inquiries_curatorId_status_createdAt_idx" ON "inquiries"("curatorId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "commission_quotes_inquiryId_key" ON "commission_quotes"("inquiryId");

-- CreateIndex
CREATE UNIQUE INDEX "commission_quotes_number_key" ON "commission_quotes"("number");

-- CreateIndex
CREATE INDEX "commission_milestones_inquiryId_status_idx" ON "commission_milestones"("inquiryId", "status");

-- CreateIndex
CREATE INDEX "favorites_artworkId_createdAt_idx" ON "favorites"("artworkId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_userId_artworkId_key" ON "favorites"("userId", "artworkId");

-- CreateIndex
CREATE INDEX "curator_badges_artworkId_kind_expiresAt_idx" ON "curator_badges"("artworkId", "kind", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "curated_collections_slug_key" ON "curated_collections"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "collection_items_collectionId_artworkId_key" ON "collection_items"("collectionId", "artworkId");

-- CreateIndex
CREATE INDEX "notifications_userId_topic_createdAt_idx" ON "notifications"("userId", "topic", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_status_createdAt_idx" ON "notifications"("status", "createdAt");

-- CreateIndex
CREATE INDEX "email_logs_notifId_idx" ON "email_logs"("notifId");

-- CreateIndex
CREATE INDEX "email_logs_provider_status_idx" ON "email_logs"("provider", "status");

-- CreateIndex
CREATE UNIQUE INDEX "artists_slugEn_key" ON "artists"("slugEn");

-- CreateIndex
CREATE UNIQUE INDEX "artists_slugRo_key" ON "artists"("slugRo");

-- CreateIndex
CREATE UNIQUE INDEX "artworks_slugEn_key" ON "artworks"("slugEn");

-- CreateIndex
CREATE UNIQUE INDEX "artworks_slugRo_key" ON "artworks"("slugRo");

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_phoneEncId_fkey" FOREIGN KEY ("phoneEncId") REFERENCES "pii_ciphers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_notes" ADD CONSTRAINT "admin_notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "returns" ADD CONSTRAINT "returns_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "returns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "returns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consents" ADD CONSTRAINT "consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_acceptances" ADD CONSTRAINT "legal_acceptances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_acceptances" ADD CONSTRAINT "legal_acceptances_docId_fkey" FOREIGN KEY ("docId") REFERENCES "legal_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_export_tasks" ADD CONSTRAINT "data_export_tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deletion_requests" ADD CONSTRAINT "deletion_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "artworks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_curatorId_fkey" FOREIGN KEY ("curatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_messages" ADD CONSTRAINT "inquiry_messages_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_files" ADD CONSTRAINT "inquiry_files_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_quotes" ADD CONSTRAINT "commission_quotes_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_milestones" ADD CONSTRAINT "commission_milestones_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "artworks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artwork_stats" ADD CONSTRAINT "artwork_stats_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "artworks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_stats" ADD CONSTRAINT "artist_stats_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curator_badges" ADD CONSTRAINT "curator_badges_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "artworks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curator_badges" ADD CONSTRAINT "curator_badges_curatorId_fkey" FOREIGN KEY ("curatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "curated_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "artworks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_notif_prefs" ADD CONSTRAINT "user_notif_prefs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_notifId_fkey" FOREIGN KEY ("notifId") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
