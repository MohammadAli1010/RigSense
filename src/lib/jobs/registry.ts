import { canReachDatabase } from "@/lib/database-reachability";
import type { JobDefinition } from "@/lib/jobs/types";
import { pricingService } from "@/lib/pricing/service";
import { prisma } from "@/lib/db";

const healthCheckJob: JobDefinition = {
  type: "foundation.health-check",
  description: "Checks foundation runtime readiness",
  async handler(_payload, context) {
    const databaseReachable = await canReachDatabase();

    return {
      summary: "Foundation health check completed.",
      metadata: {
        jobId: context.jobId,
        databaseReachable,
      },
    };
  },
};

const priceRefreshJob: JobDefinition = {
  type: "catalog.price-refresh",
  description: "Refreshes part pricing from external providers",
  async handler(payload: any, context) {
    // If partId provided, refresh single part. Otherwise, find all stale parts and schedule.
    if (payload?.partId) {
      await pricingService.refreshPartPricing(payload.partId);
      return { summary: `Refreshed pricing for part ${payload.partId}` };
    }
    
    // Refresh batch of parts (e.g. oldest updated first)
    const staleParts = await prisma.part.findMany({
      orderBy: { lastUpdated: 'asc' },
      take: 10
    });
    
    for (const part of staleParts) {
      await pricingService.refreshPartPricing(part.id);
    }
    
    return {
      summary: `Batch refreshed pricing for ${staleParts.length} parts.`,
      metadata: {
        jobId: context.jobId,
        refreshedCount: staleParts.length
      },
    };
  },
};

export const jobDefinitions = [healthCheckJob, priceRefreshJob] as const;

export const jobDefinitionMap = new Map(jobDefinitions.map((definition) => [definition.type, definition]));
