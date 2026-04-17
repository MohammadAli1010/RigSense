-- CreateEnum
CREATE TYPE "PerformanceTier" AS ENUM ('BUDGET', 'MAINSTREAM', 'HIGH_END', 'ENTHUSIAST');

-- AlterTable
ALTER TABLE "Build" ADD COLUMN     "intendedUse" TEXT NOT NULL DEFAULT 'Gaming',
ADD COLUMN     "performanceTier" "PerformanceTier" NOT NULL DEFAULT 'MAINSTREAM';
