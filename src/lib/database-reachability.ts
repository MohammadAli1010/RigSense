import net from "node:net";

import { env } from "@/lib/env";
import { errorReporting } from "@/lib/error-reporting";
import { logger } from "@/lib/logger";

let databaseReachability: "unknown" | "available" | "unavailable" = "unknown";

export async function canReachDatabase() {
  if (databaseReachability === "available") {
    return true;
  }

  if (databaseReachability === "unavailable") {
    return false;
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(env.DATABASE_URL);
  } catch (error) {
    databaseReachability = "unavailable";
    errorReporting.captureException(error, {
      scope: "database-reachability",
      operation: "parse-database-url",
    });
    return false;
  }

  const host = parsedUrl.hostname;
  const port = Number(parsedUrl.port || 5432);

  const reachable = await new Promise<boolean>((resolve) => {
    const socket = net.createConnection({ host, port });

    const finalize = (value: boolean) => {
      socket.destroy();
      resolve(value);
    };

    socket.setTimeout(600);
    socket.once("connect", () => finalize(true));
    socket.once("timeout", () => finalize(false));
    socket.once("error", () => finalize(false));
  });

  databaseReachability = reachable ? "available" : "unavailable";

  if (!reachable) {
    logger.warn("database.unreachable", {
      host,
      port,
    });
  }

  return reachable;
}

export async function safeDatabaseQuery<T>(
  query: () => Promise<T>,
  options: {
    label: string;
  },
) {
  if (!(await canReachDatabase())) {
    return null;
  }

  try {
    return await query();
  } catch (error) {
    databaseReachability = "unavailable";
    errorReporting.captureException(error, {
      scope: "database-query",
      label: options.label,
    });
    logger.warn("database.query_failed", {
      label: options.label,
    });
    return null;
  }
}

export function resetDatabaseReachability() {
  databaseReachability = "unknown";
}
