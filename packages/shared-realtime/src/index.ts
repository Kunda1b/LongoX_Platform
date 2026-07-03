import type { PlatformEvent, PlatformEventType } from "@longox/shared-events";
import { logger } from "@longox/shared-logger";

export interface SseClient {
  id: string;
  userId?: string;
  tenantId?: string;
  interests: Set<string>;
  send(event: string, data: unknown): void;
  close(): void;
}

export interface SubscriptionFilter {
  userId?: string;
  tenantId?: string;
  types?: PlatformEventType[];
  aggregateIds?: string[];
}

class RealtimeHub {
  private clients = new Map<string, SseClient>();
  private clientFilters = new Map<string, SubscriptionFilter>();
  private clientEventSubscriptions = new Map<string, Set<string>>();

  register(client: SseClient, filter?: SubscriptionFilter): () => void {
    this.clients.set(client.id, client);
    this.clientEventSubscriptions.set(client.id, new Set(["*"]));
    if (filter) {
      this.clientFilters.set(client.id, filter);
    }
    logger.info({ clientId: client.id }, "[Realtime] Client registered");

    return () => {
      this.clients.delete(client.id);
      this.clientFilters.delete(client.id);
      this.clientEventSubscriptions.delete(client.id);
      logger.info({ clientId: client.id }, "[Realtime] Client unregistered");
    };
  }

  subscribe(clientId: string, eventTypes: string[]): void {
    const subs = this.clientEventSubscriptions.get(clientId);
    if (subs) {
      if (eventTypes.includes("*")) {
        subs.clear();
        subs.add("*");
      } else {
        subs.delete("*");
        for (const t of eventTypes) subs.add(t);
      }
    }
  }

  unsubscribe(clientId: string, eventTypes: string[]): void {
    const subs = this.clientEventSubscriptions.get(clientId);
    if (subs) {
      for (const t of eventTypes) subs.delete(t);
      if (subs.size === 0) subs.add("*");
    }
  }

  broadcast(event: PlatformEvent): void {
    let delivered = 0;
    for (const [id, client] of this.clients) {
      const filter = this.clientFilters.get(id);
      const subs = this.clientEventSubscriptions.get(id) ?? new Set(["*"]);

      if (filter) {
        if (filter.tenantId && event.payload.tenantId !== filter.tenantId)
          continue;
        if (
          filter.types &&
          !filter.types.includes(event.type as PlatformEventType)
        )
          continue;
        if (
          filter.aggregateIds &&
          !filter.aggregateIds.includes(event.aggregateId)
        )
          continue;
      }

      if (subs.has(event.type) || subs.has("*")) {
        try {
          client.send("event", event);
          delivered++;
        } catch (err) {
          logger.error(
            { clientId: id, err },
            "[Realtime] Send error, removing client",
          );
          this.clients.delete(id);
          this.clientFilters.delete(id);
          this.clientEventSubscriptions.delete(id);
        }
      }
    }

    if (delivered > 0) {
      logger.debug(
        { eventType: event.type, delivered },
        "[Realtime] Event delivered",
      );
    }
  }

  getClientCount(): number {
    return this.clients.size;
  }

  getClientsForAggregate(aggregateId: string): SseClient[] {
    const result: SseClient[] = [];
    for (const [id, client] of this.clients) {
      const filter = this.clientFilters.get(id);
      if (filter?.aggregateIds?.includes(aggregateId)) {
        result.push(client);
      }
    }
    return result;
  }
}

export const realtimeHub = new RealtimeHub();

export function createSseWriter(
  res: any,
  options?: { interest?: string[] },
): SseClient {
  const id = `sse_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  res.write(`event: connected\ndata: ${JSON.stringify({ clientId: id })}\n\n`);

  const keepalive = setInterval(() => {
    try {
      res.write(`:keepalive\n\n`);
    } catch {
      clearInterval(keepalive);
    }
  }, 15000);

  const eventTypes = options?.interest;
  const interests = eventTypes && eventTypes.length > 0
    ? new Set(eventTypes)
    : new Set(["*"]);

  const client: SseClient = {
    id,
    interests,
    send(event: string, data: unknown) {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    },
    close() {
      clearInterval(keepalive);
      try {
        res.end();
      } catch {}
    },
  };

  if (eventTypes && eventTypes.length > 0) {
    realtimeHub.subscribe(id, eventTypes);
  }

  res.on("close", () => {
    clearInterval(keepalive);
    realtimeHub.register.length;
    client.close();
  });

  return client;
}

export { sseExecutionBus, setRedisClient } from "./execution-bus";
export type { ExecutionEventPayload } from "./execution-bus";
export { publishEvent } from "./publisher";

export type { PlatformEvent, PlatformEventType };
