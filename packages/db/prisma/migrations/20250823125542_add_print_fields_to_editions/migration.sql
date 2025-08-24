-- CreateEnum
CREATE TYPE "PrintMaterial" AS ENUM ('CANVAS', 'METAL');

-- AlterTable
ALTER TABLE "editions" ADD COLUMN     "heightCm" DECIMAL(65,30),
ADD COLUMN     "material" "PrintMaterial",
ADD COLUMN     "sizeName" TEXT,
ADD COLUMN     "widthCm" DECIMAL(65,30);
