import { logger, toLoggableError, type LogContext } from "@/lib/logger";

export interface ErrorReportingClient {
  captureException(error: unknown, context?: LogContext): void;
}

class DefaultErrorReportingClient implements ErrorReportingClient {
  captureException(error: unknown, context: LogContext = {}) {
    logger.error("error.captured", {
      error: toLoggableError(error),
      ...context,
    });
  }
}

export const errorReporting: ErrorReportingClient = new DefaultErrorReportingClient();
