import { prisma } from "@/lib/db";
import { pricingService } from "./pricingService";
import { Part } from "@prisma/client";

export class PriceUpdateJob {
  private readonly batchSize = 5;
  private readonly delayBetweenBatches = 10000;
  private readonly delayBetweenRequests = 3000;

  async updateAllPartPrices(): Promise<{
    updated: number;
    failed: number;
    skipped: number;
  }> {
    console.log("Starting price update job...");

    let updated = 0;
    let failed = 0;
    let skipped = 0;

    try {
      const partsNeedingUpdate = await prisma.part.findMany({
        take: 50,
      });

      console.log(`Found ${partsNeedingUpdate.length} parts needing price updates`);

      for (let i = 0; i < partsNeedingUpdate.length; i += this.batchSize) {
        const batch = partsNeedingUpdate.slice(i, i + this.batchSize);

        for (const part of batch) {
          const result = await this.updatePartPrice(part);
          if (result.success) updated++;
          else if (result.skipped) skipped++;
          else failed++;

          if (i + batch.indexOf(part) < partsNeedingUpdate.length - 1) {
            await this.delay(this.delayBetweenRequests);
          }
        }

        if (i + this.batchSize < partsNeedingUpdate.length) {
          await this.delay(this.delayBetweenBatches);
        }
      }

      console.log(
        `Price update job completed: ${updated} updated, ${failed} failed, ${skipped} skipped`,
      );
      return { updated, failed, skipped };
    } catch (error) {
      console.error("Price update job failed:", error);
      throw error;
    }
  }

  private async updatePartPrice(part: Part): Promise<{ success: boolean; skipped: boolean }> {
    try {
      if (part.updatedAt && Date.now() - part.updatedAt.getTime() < 30 * 60 * 1000) {
        return { success: false, skipped: true };
      }

      const priceData = await pricingService.getPartPrice(part.slug, part.category);

      await prisma.part.update({
        where: { id: part.id },
        data: {
          priceCents: priceData.priceCents,
          priceSource: priceData.source,
        },
      });

      console.log(
        `Updated price for ${part.name}: $${(priceData.priceCents / 100).toFixed(2)} (${priceData.source})`,
      );
      return { success: true, skipped: false };
    } catch (error) {
      console.error(`Failed to update price for ${part.name}:`, error);
      return { success: false, skipped: false };
    }
  }

  async updatePartPriceBySlug(slug: string): Promise<boolean> {
    try {
      const part = await prisma.part.findUnique({
        where: { slug },
      });

      if (!part) {
        console.warn(`Part not found: ${slug}`);
        return false;
      }

      const result = await this.updatePartPrice(part);
      return result.success;
    } catch (error) {
      console.error(`Failed to update price for slug ${slug}:`, error);
      return false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const priceUpdateJob = new PriceUpdateJob();
