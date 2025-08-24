-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('READY_TO_SHIP', 'LABEL_PURCHASED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "shippingMethod" TEXT,
ADD COLUMN     "shippingServiceName" TEXT;

-- CreateTable
CREATE TABLE "shipments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "serviceName" TEXT,
    "zone" TEXT,
    "insuredAmount" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" "ShipmentStatus" NOT NULL DEFAULT 'READY_TO_SHIP',
    "labelStorageKey" TEXT,
    "trackingNumbers" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_packages" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "refId" TEXT,
    "lengthCm" DECIMAL(65,30) NOT NULL,
    "widthCm" DECIMAL(65,30),
    "heightCm" DECIMAL(65,30),
    "diameterCm" DECIMAL(65,30),
    "weightKg" DECIMAL(65,30) NOT NULL,
    "dimWeightKg" DECIMAL(65,30) NOT NULL,
    "items" JSONB NOT NULL,

    CONSTRAINT "shipment_packages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shipments_orderId_status_idx" ON "shipments"("orderId", "status");

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_packages" ADD CONSTRAINT "shipment_packages_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
