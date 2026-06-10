import type { PlatformEventType } from "@autoflow/shared-events";
import { logger } from "@autoflow/shared-logger";

const INTERNAL_API_KEY = process.env["INTERNAL_API_KEY"];
const EVENTS_BRIDGE_URL = process.env["EVENTS_BRIDGE_URL"] ?? "http://localhost:8080/api/events/publish";

interface PublishOptions {
  type: PlatformEventType;
  aggregateId: string;
  aggregateType: string;
  payload?: Record<string, unknown>;
  actorId?: string;
  actorType?: "user" | "system" | "webhook" | "schedule";
  correlationId?: string;
}

export async function publishEvent(options: PublishOptions): Promise<void> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (INTERNAL_API_KEY) {
      headers["x-internal-api-key"] = INTERNAL_API_KEY;
    }

    const res = await fetch(EVENTS_BRIDGE_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(options),
    });

    if (!res.ok) {
      logger.warn(
        { eventType: options.type, status: res.status },
        "[EventPublisher] Failed to publish event",
      );
    }
  } catch (err) {
    logger.error({ err, eventType: options.type }, "[EventPublisher] Error publishing event");
  }
}
