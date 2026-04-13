import { canReachDatabase } from "@/lib/database-reachability";
import type { JobDefinition } from "@/lib/jobs/types";

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

export const jobDefinitions = [healthCheckJob] as const;

export const jobDefinitionMap = new Map(jobDefinitions.map((definition) => [definition.type, definition]));
