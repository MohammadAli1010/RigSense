import { isTest } from "@/lib/env";

type LogLevel = "info" | "warn" | "error";

export type LogContext = Record<string, unknown>;

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return error;
}

function replacer(_key: string, value: unknown) {
  if (value instanceof Error) {
    return serializeError(value);
  }

  return value;
}

function write(level: LogLevel, message: string, context: LogContext = {}) {
  if (isTest && level !== "error") {
    return;
  }

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };

  const payload = JSON.stringify(entry, replacer);

  switch (level) {
    case "error":
      console.error(payload);
      break;
    case "warn":
      console.warn(payload);
      break;
    default:
      console.info(payload);
      break;
  }
}

export const logger = {
  info(message: string, context?: LogContext) {
    write("info", message, context);
  },
  warn(message: string, context?: LogContext) {
    write("warn", message, context);
  },
  error(message: string, context?: LogContext) {
    write("error", message, context);
  },
};

export function toLoggableError(error: unknown) {
  return serializeError(error);
}
