import { JobStatus, Prisma } from "@prisma/client";

import { analytics } from "@/lib/analytics";
import { prisma } from "@/lib/db";
import { errorReporting } from "@/lib/error-reporting";
import { jobDefinitionMap } from "@/lib/jobs/registry";
import type { JobExecutionResult, JobPayload } from "@/lib/jobs/types";
import { logger } from "@/lib/logger";

type EnqueueJobInput = {
  type: string;
  payload?: JobPayload;
  maxAttempts?: number;
  scheduledFor?: Date | null;
};

export type RunJobResult = {
  status: JobStatus;
  result?: JobExecutionResult;
  jobId: string;
};

function serializePayload(payload: JobPayload): Prisma.InputJsonValue | Prisma.JsonNullValueInput {
  if (payload === null) {
    return Prisma.JsonNull;
  }

  return payload as Prisma.InputJsonValue;
}

export async function enqueueJob({
  type,
  payload = null,
  maxAttempts = 3,
  scheduledFor = null,
}: EnqueueJobInput) {
  const job = await prisma.backgroundJob.create({
    data: {
      type,
      payload: serializePayload(payload),
      maxAttempts,
      scheduledFor,
    },
  });

  logger.info("job.enqueued", {
    jobId: job.id,
    type,
    scheduledFor: scheduledFor?.toISOString() ?? null,
  });

  return job;
}

function getHandler(type: string) {
  return jobDefinitionMap.get(type) ?? null;
}

function toJobPayload(value: Prisma.JsonValue | null): JobPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

export async function runJobById(jobId: string): Promise<RunJobResult> {
  const job = await prisma.backgroundJob.findUnique({
    where: {
      id: jobId,
    },
  });

  if (!job) {
    throw new Error(`Background job ${jobId} was not found.`);
  }

  const definition = getHandler(job.type);

  if (!definition) {
    await prisma.backgroundJob.update({
      where: {
        id: job.id,
      },
      data: {
        status: JobStatus.FAILED,
        attempts: {
          increment: 1,
        },
        completedAt: new Date(),
        lastError: `No handler registered for job type ${job.type}.`,
      },
    });

    throw new Error(`No handler registered for background job type ${job.type}.`);
  }

  const startedAt = Date.now();

  await prisma.backgroundJob.update({
    where: {
      id: job.id,
    },
    data: {
      status: JobStatus.RUNNING,
      attempts: {
        increment: 1,
      },
      startedAt: new Date(),
      completedAt: null,
      lastError: null,
    },
  });

  logger.info("job.started", {
    jobId: job.id,
    type: job.type,
  });

  try {
    const result = await definition.handler(toJobPayload(job.payload), {
      jobId: job.id,
    });
    const durationMs = Date.now() - startedAt;

    await prisma.backgroundJob.update({
      where: {
        id: job.id,
      },
      data: {
        status: JobStatus.SUCCEEDED,
        completedAt: new Date(),
        lastDurationMs: durationMs,
        lastError: null,
      },
    });

    analytics.track("job_succeeded", {
      jobId: job.id,
      type: job.type,
      durationMs,
    });
    logger.info("job.completed", {
      jobId: job.id,
      type: job.type,
      durationMs,
    });

    return {
      jobId: job.id,
      status: JobStatus.SUCCEEDED,
      result,
    };
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const exhaustedAttempts = job.attempts + 1 >= job.maxAttempts;
    const status = exhaustedAttempts ? JobStatus.FAILED : JobStatus.PENDING;

    await prisma.backgroundJob.update({
      where: {
        id: job.id,
      },
      data: {
        status,
        completedAt: new Date(),
        lastDurationMs: durationMs,
        lastError: error instanceof Error ? error.message : "Unknown job execution error.",
      },
    });

    errorReporting.captureException(error, {
      scope: "job.run",
      jobId: job.id,
      type: job.type,
      exhaustedAttempts,
    });
    analytics.track("job_failed", {
      jobId: job.id,
      type: job.type,
      durationMs,
      exhaustedAttempts,
    });
    logger.warn("job.failed", {
      jobId: job.id,
      type: job.type,
      durationMs,
      nextStatus: status,
    });

    return {
      jobId: job.id,
      status,
    };
  }
}

export async function runDueJobs(limit = 10) {
  const now = new Date();
  const jobs = await prisma.backgroundJob.findMany({
    where: {
      status: JobStatus.PENDING,
      OR: [
        {
          scheduledFor: null,
        },
        {
          scheduledFor: {
            lte: now,
          },
        },
      ],
    },
    orderBy: {
      createdAt: "asc",
    },
    take: limit,
  });

  const results: RunJobResult[] = [];

  for (const job of jobs) {
    results.push(await runJobById(job.id));
  }

  return results;
}

export async function enqueueAndRunJob(input: EnqueueJobInput) {
  const job = await enqueueJob(input);

  return runJobById(job.id);
}
