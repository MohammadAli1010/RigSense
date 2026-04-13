import { isDevelopment } from "@/lib/env";
import { logger } from "@/lib/logger";

export type AnalyticsProperties = Record<string, unknown>;

export interface AnalyticsClient {
  track(event: string, properties?: AnalyticsProperties): void;
}

class DefaultAnalyticsClient implements AnalyticsClient {
  track(event: string, properties: AnalyticsProperties = {}) {
    if (!isDevelopment) {
      return;
    }

    logger.info("analytics.event", {
      event,
      properties,
    });
  }
}

export const analytics: AnalyticsClient = new DefaultAnalyticsClient();
