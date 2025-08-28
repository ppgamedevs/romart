-- AlterTable
ALTER TABLE "public"."artworks" ALTER COLUMN "priceAmount" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."editions" ALTER COLUMN "unitAmount" DROP NOT NULL;
