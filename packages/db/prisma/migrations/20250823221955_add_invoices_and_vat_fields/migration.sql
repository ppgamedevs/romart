-- AlterTable
ALTER TABLE "addresses" ADD COLUMN     "isBusiness" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vatId" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "shippingAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "subtotalAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "taxAmount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "carts" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "anonymousId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "kind" "ArtworkKind" NOT NULL,
    "artworkId" TEXT,
    "editionId" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitAmount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artwork_holds" (
    "id" TEXT NOT NULL,
    "artworkId" TEXT NOT NULL,
    "orderId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artwork_holds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digital_entitlements" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "digital_entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "series" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "sellerName" TEXT NOT NULL,
    "sellerVatId" TEXT,
    "sellerRegNo" TEXT,
    "sellerAddress" JSONB NOT NULL,
    "buyerName" TEXT NOT NULL,
    "buyerVatId" TEXT,
    "buyerAddress" JSONB NOT NULL,
    "subtotalAmount" INTEGER NOT NULL,
    "taxAmount" INTEGER NOT NULL,
    "shippingAmount" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "notes" TEXT,
    "pdfStorageKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitAmount" INTEGER NOT NULL,
    "taxRate" DECIMAL(65,30),
    "taxAmount" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vat_validation_cache" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "vatId" TEXT NOT NULL,
    "valid" BOOLEAN NOT NULL,
    "name" TEXT,
    "address" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vat_validation_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_counters" (
    "id" TEXT NOT NULL,
    "series" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "nextNo" INTEGER NOT NULL,

    CONSTRAINT "invoice_counters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "carts_anonymousId_key" ON "carts"("anonymousId");

-- CreateIndex
CREATE INDEX "carts_userId_idx" ON "carts"("userId");

-- CreateIndex
CREATE INDEX "cart_items_cartId_idx" ON "cart_items"("cartId");

-- CreateIndex
CREATE UNIQUE INDEX "artwork_holds_artworkId_key" ON "artwork_holds"("artworkId");

-- CreateIndex
CREATE UNIQUE INDEX "digital_entitlements_token_key" ON "digital_entitlements"("token");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_orderId_key" ON "invoices"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_number_key" ON "invoices"("number");

-- CreateIndex
CREATE UNIQUE INDEX "vat_validation_cache_country_vatId_key" ON "vat_validation_cache"("country", "vatId");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_counters_series_year_key" ON "invoice_counters"("series", "year");

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "artworks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "editions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artwork_holds" ADD CONSTRAINT "artwork_holds_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "artworks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
