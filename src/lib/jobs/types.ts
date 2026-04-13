export type JobPayload = Record<string, unknown> | null;

export type JobExecutionResult = {
  summary: string;
  metadata?: Record<string, unknown>;
};

export type JobHandlerContext = {
  jobId: string;
};

export type JobHandler = (
  payload: JobPayload,
  context: JobHandlerContext,
) => Promise<JobExecutionResult>;

export type JobDefinition = {
  type: string;
  description: string;
  handler: JobHandler;
};
