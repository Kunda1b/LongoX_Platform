import { randomUUID } from "node:crypto";

export type PlatformEventType =
  | "workflow.created"
  | "workflow.updated"
  | "workflow.deleted"
  | "workflow.published"
  | "workflow.activated"
  | "workflow.deactivated"
  | "workflow.promoted"
  | "workflow.rolled-back"
  | "execution.started"
  | "execution.completed"
  | "execution.failed"
  | "execution.retried"
  | "execution.cancelled"
  | "connector.installed"
  | "connector.uninstalled"
  | "connector.updated"
  | "user.login"
  | "user.created"
  | "user.updated"
  | "tenant.created"
  | "tenant.updated"
  | "billing.usage.recorded"
  | "billing.invoice.generated"
  | "template.published"
  | "template.installed"
  | "dashboard.published"
  | "dashboard.created"
  | "ai.run.completed"
  | "ai.run.failed"
  | "environment.promoted"
  | "environment.rolled-back";

export interface PlatformEvent {
  id: string;
  type: PlatformEventType;
  aggregateId: string;
  aggregateType: string;
  payload: Record<string, unknown>;
  actorId: string | null;
  actorType: "user" | "system" | "webhook" | "schedule";
  correlationId: string | null;
  timestamp: string;
}

export type EventHandler<T = unknown> = (event: T) => Promise<void> | void;

export function createEvent(
  type: PlatformEventType,
  aggregateId: string,
  aggregateType: string,
  payload: Record<string, unknown> = {},
  actor: { id?: string; type?: "user" | "system" | "webhook" | "schedule" } = {},
  correlationId?: string,
): PlatformEvent {
  return {
    id: randomUUID(),
    type,
    aggregateId,
    aggregateType,
    payload,
    actorId: actor.id ?? null,
    actorType: actor.type ?? "system",
    correlationId: correlationId ?? null,
    timestamp: new Date().toISOString(),
  };
}

export interface EventBus {
  publish(event: Omit<PlatformEvent, "id" | "timestamp">): Promise<void>;
  subscribe(type: string, handler: EventHandler<PlatformEvent>): () => void;
}

export class InMemoryEventBus implements EventBus {
  private handlers = new Map<string, Set<EventHandler<PlatformEvent>>>();

  async publish(event: Omit<PlatformEvent, "id" | "timestamp">): Promise<void> {
    const fullEvent: PlatformEvent = {
      ...event,
      id: randomUUID(),
      timestamp: new Date().toISOString(),
    };

    const handlers = this.handlers.get(event.type);
    if (handlers) {
      const promises: Promise<void>[] = [];
      for (const handler of handlers) {
        try {
          const result = handler(fullEvent);
          if (result instanceof Promise) {
            promises.push(result);
          }
        } catch (err) {
          console.error(`[EventBus] Handler error for ${event.type}:`, err);
        }
      }
      await Promise.allSettled(promises);
    }

    const wildcardHandlers = this.handlers.get("*");
    if (wildcardHandlers) {
      const promises: Promise<void>[] = [];
      for (const handler of wildcardHandlers) {
        try {
          const result = handler(fullEvent);
          if (result instanceof Promise) {
            promises.push(result);
          }
        } catch (err) {
          console.error(`[EventBus] Wildcard handler error:`, err);
        }
      }
      await Promise.allSettled(promises);
    }
  }

  subscribe(type: string, handler: EventHandler<PlatformEvent>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);

    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }
}

export class RedisEventBus implements EventBus {
  private subscriber: import("ioredis").Redis | null = null;
  private publisher: import("ioredis").Redis | null = null;
  private localHandlers = new Map<string, Set<EventHandler<PlatformEvent>>>();
  private subscribedChannels = new Set<string>();
  private channelPrefix = "flowcraft:events:";

  constructor(private redisUrl?: string) {
    if (redisUrl) this.connect().catch(() => {});
  }

  private async connect(): Promise<void> {
    try {
      const { Redis } = await import("ioredis");
      this.subscriber = new Redis(this.redisUrl!, { maxRetriesPerRequest: 3, lazyConnect: true });
      this.publisher = new Redis(this.redisUrl!, { maxRetriesPerRequest: 3, lazyConnect: true });
      await Promise.all([this.subscriber.connect(), this.publisher.connect()]);
    } catch (err) {
      console.warn("[RedisEventBus] Failed to connect, falling back to in-memory:", err);
      this.subscriber = null;
      this.publisher = null;
    }
  }

  async publish(event: Omit<PlatformEvent, "id" | "timestamp">): Promise<void> {
    const fullEvent: PlatformEvent = {
      ...event,
      id: randomUUID(),
      timestamp: new Date().toISOString(),
    };

    // Always publish to local handlers
    await this.publishLocal(fullEvent);

    // Also publish to Redis if connected
    if (this.publisher) {
      try {
        const channel = `${this.channelPrefix}${event.type}`;
        await this.publisher.publish(channel, JSON.stringify(fullEvent));
        await this.publisher.publish(`${this.channelPrefix}*`, JSON.stringify(fullEvent));
      } catch { /* silent fallback */ }
    }
  }

  private async publishLocal(event: PlatformEvent): Promise<void> {
    const handlers = this.localHandlers.get(event.type);
    if (handlers) {
      const promises: Promise<void>[] = [];
      for (const handler of handlers) {
        try {
          const result = handler(event);
          if (result instanceof Promise) promises.push(result);
        } catch (err) {
          console.error(`[RedisEventBus] Handler error for ${event.type}:`, err);
        }
      }
      await Promise.allSettled(promises);
    }

    const wildcardHandlers = this.localHandlers.get("*");
    if (wildcardHandlers) {
      const promises: Promise<void>[] = [];
      for (const handler of wildcardHandlers) {
        try {
          const result = handler(event);
          if (result instanceof Promise) promises.push(result);
        } catch (err) {
          console.error(`[RedisEventBus] Wildcard handler error:`, err);
        }
      }
      await Promise.allSettled(promises);
    }
  }

  subscribe(type: string, handler: EventHandler<PlatformEvent>): () => void {
    if (!this.localHandlers.has(type)) {
      this.localHandlers.set(type, new Set());
    }
    this.localHandlers.get(type)!.add(handler);

    // Subscribe to Redis channel if connected
    if (this.subscriber && !this.subscribedChannels.has(type)) {
      this.subscribedChannels.add(type);
      const channel = `${this.channelPrefix}${type}`;
      this.subscriber.subscribe(channel, (err) => {
        if (err) console.warn(`[RedisEventBus] Failed to subscribe to ${channel}:`, err);
      });
      this.subscriber!.on("message", (ch, message) => {
        if (ch === channel || ch === `${this.channelPrefix}*`) {
          try {
            const event = JSON.parse(message) as PlatformEvent;
            this.publishLocal(event).catch(() => {});
          } catch { /* ignore parse errors */ }
        }
      });
    }

    return () => {
      this.localHandlers.get(type)?.delete(handler);
    };
  }
}

export const eventBus = new InMemoryEventBus();

export function initEventBus(redisUrl?: string): EventBus {
  if (redisUrl) {
    const bus = new RedisEventBus(redisUrl);
    return bus;
  }
  return eventBus;
}

export { InMemoryEventBus as LocalEventBus };
