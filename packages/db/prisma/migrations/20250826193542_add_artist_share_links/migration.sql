-- AlterTable
ALTER TABLE "public"."orders" ADD COLUMN     "artistShareLinkId" TEXT;

-- CreateTable
CREATE TABLE "public"."artist_share_links" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "landing" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artist_share_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."artist_share_visits" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "source" TEXT,
    "utm" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artist_share_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."artist_share_conversions" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "subtotalMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artist_share_conversions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "artist_share_links_slug_key" ON "public"."artist_share_links"("slug");

-- CreateIndex
CREATE INDEX "artist_share_links_artistId_createdAt_idx" ON "public"."artist_share_links"("artistId", "createdAt");

-- CreateIndex
CREATE INDEX "artist_share_visits_linkId_createdAt_idx" ON "public"."artist_share_visits"("linkId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "artist_share_conversions_orderId_key" ON "public"."artist_share_conversions"("orderId");

-- CreateIndex
CREATE INDEX "artist_share_conversions_linkId_createdAt_idx" ON "public"."artist_share_conversions"("linkId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_artistShareLinkId_fkey" FOREIGN KEY ("artistShareLinkId") REFERENCES "public"."artist_share_links"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."artist_share_links" ADD CONSTRAINT "artist_share_links_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "public"."artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."artist_share_visits" ADD CONSTRAINT "artist_share_visits_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "public"."artist_share_links"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."artist_share_conversions" ADD CONSTRAINT "artist_share_conversions_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "public"."artist_share_links"("id") ON DELETE CASCADE ON UPDATE CASCADE;
