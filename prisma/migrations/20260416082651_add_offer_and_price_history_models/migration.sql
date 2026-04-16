-- CreateEnum
CREATE TYPE "OfferAvailability" AS ENUM ('IN_STOCK', 'OUT_OF_STOCK', 'LIMITED', 'UNKNOWN');

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "retailer" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "availability" "OfferAvailability" NOT NULL,
    "source" TEXT NOT NULL,
    "retrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "retrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Offer_partId_idx" ON "Offer"("partId");

-- CreateIndex
CREATE INDEX "Offer_retrievedAt_idx" ON "Offer"("retrievedAt");

-- CreateIndex
CREATE INDEX "PriceHistory_partId_retrievedAt_idx" ON "PriceHistory"("partId", "retrievedAt");

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE CASCADE ON UPDATE CASCADE;
