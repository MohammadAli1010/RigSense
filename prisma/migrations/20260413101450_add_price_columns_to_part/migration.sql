-- AlterTable
ALTER TABLE "Part" ADD COLUMN     "lastUpdated" TIMESTAMP(3),
ADD COLUMN     "priceSource" TEXT;

-- CreateIndex
CREATE INDEX "Part_priceSource_idx" ON "Part"("priceSource");

-- CreateIndex
CREATE INDEX "Part_lastUpdated_idx" ON "Part"("lastUpdated");
