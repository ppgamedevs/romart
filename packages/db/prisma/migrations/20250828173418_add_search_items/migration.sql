-- CreateTable
CREATE TABLE "public"."search_items" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artistName" TEXT NOT NULL,
    "medium" "public"."ProductMedium" NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "priceMinor" INTEGER,
    "widthCm" DOUBLE PRECISION,
    "heightCm" DOUBLE PRECISION,
    "orientation" TEXT,
    "curatedScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "views30" INTEGER NOT NULL DEFAULT 0,
    "saves30" INTEGER NOT NULL DEFAULT 0,
    "purchases90" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "search_items_slug_key" ON "public"."search_items"("slug");
