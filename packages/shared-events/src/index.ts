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
  | "workflow.started"
  | "workflow.completed"
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
  | "prompt.published"
  | "prompt.approved"
  | "prompt.rejected"
  | "environment.promoted"
  | "environment.rolled-back"
  | "agent.run.started"
  | "agent.run.completed"
  | "agent.run.failed";

export interface PlatformEvent {
  id: string;
  type: PlatformEventType;
  aggregateId: string;
  aggregateType: string;
  payload: Record<string, unknown>;
  actorId: string | null;
  actorType: "user" | "system" | "webhook" | "schedule";
  correlationId: string | null;
  causationId: string | null;
  version: number;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export type EventHandler<T = unknown> = (event: T) => Promise<void> | void;

export function createEvent(
  type: PlatformEventType,
  aggregateId: string,
  aggregateType: string,
  payload: Record<string, unknown> = {},
  actor: {
    id?: string;
    type?: "user" | "system" | "webhook" | "schedule";
  } = {},
  correlationId?: string,
  causationId?: string,
  metadata: Record<string, unknown> = {},
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
    causationId: causationId ?? null,
    version: 1,
    metadata,
    timestamp: new Date().toISOString(),
  };
}

export interface EventBus {
  publish(event: Omit<PlatformEvent, "id" | "timestamp">): Promise<void>;
  subscribe(type: string, handler: EventHandler<PlatformEvent>): () => void;
  connect?(): Promise<void>;
  disconnect?(): Promise<void>;
  health?(): Promise<{ connected: boolean; latencyMs: number }>;
}

export interface DeadLetterEvent {
  event: PlatformEvent;
  error: string;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: string;
  createdAt: string;
}

export interface EventBusMetrics {
  published: number;
  delivered: number;
  failed: number;
  deadLettered: number;
  avgDeliveryMs: number;
}

export class InMemoryEventBus implements EventBus {
  private handlers = new Map<string, Set<EventHandler<PlatformEvent>>>();
  private deadLetters: DeadLetterEvent[] = [];
  private metrics: EventBusMetrics = {
    published: 0,
    delivered: 0,
    failed: 0,
    deadLettered: 0,
    avgDeliveryMs: 0,
  };

  async publish(event: Omit<PlatformEvent, "id" | "timestamp">): Promise<void> {
    const fullEvent: PlatformEvent = {
      ...event,
      id: randomUUID(),
      timestamp: new Date().toISOString(),
    };

    this.metrics.published++;
    const start = Date.now();

    const handlers = this.handlers.get(event.type);
    if (handlers) {
      const promises: Promise<void>[] = [];
      for (const handler of handlers) {
        try {
          const result = handler(fullEvent);
          if (result instanceof Promise) {
            promises.push(
              result.catch((err) => {
                this.metrics.failed++;
                this.handleDeadLetter(fullEvent, err);
              }),
            );
          }
          this.metrics.delivered++;
        } catch (err) {
          this.metrics.failed++;
          this.handleDeadLetter(fullEvent, err);
        }
      }
      await Promise.allSettled(promises);
    }

    const wildcardHandlers = this.handlers.get("*");
    if (wildcardHandlers) {
      for (const handler of wildcardHandlers) {
        try {
          const result = handler(fullEvent);
          if (result instanceof Promise) await result;
          this.metrics.delivered++;
        } catch (err) {
          this.metrics.failed++;
        }
      }
    }

    this.metrics.avgDeliveryMs =
      (this.metrics.avgDeliveryMs + (Date.now() - start)) / 2;
  }

  private handleDeadLetter(event: PlatformEvent, error: unknown): void {
    const entry: DeadLetterEvent = {
      event,
      error: error instanceof Error ? error.message : String(error),
      retryCount: 0,
      maxRetries: 3,
      nextRetryAt: new Date(Date.now() + 5000).toISOString(),
      createdAt: new Date().toISOString(),
    };
    this.deadLetters.push(entry);
    this.metrics.deadLettered++;
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

  getDeadLetters(): DeadLetterEvent[] {
    return [...this.deadLetters];
  }

  getMetrics(): EventBusMetrics {
    return { ...this.metrics };
  }

  async health(): Promise<{ connected: boolean; latencyMs: number }> {
    return { connected: true, latencyMs: 0 };
  }
}

export class RedisEventBus implements EventBus {
  private subscriber: import("ioredis").Redis | null = null;
  private publisher: import("ioredis").Redis | null = null;
  private localHandlers = new Map<string, Set<EventHandler<PlatformEvent>>>();
  private subscribedChannels = new Set<string>();
  private channelPrefix = "longox:events:";
  private deadLetters: DeadLetterEvent[] = [];
  private metrics: EventBusMetrics = {
    published: 0,
    delivered: 0,
    failed: 0,
    deadLettered: 0,
    avgDeliveryMs: 0,
  };

  constructor(private redisUrl?: string) {}

  async connect(): Promise<void> {
    if (!this.redisUrl) return;
    try {
      const { Redis } = await import("ioredis");
      this.subscriber = new Redis(this.redisUrl, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });
      this.publisher = new Redis(this.redisUrl, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });
      await Promise.all([this.subscriber.connect(), this.publisher.connect()]);
    } catch (err) {
      console.warn(
        "[RedisEventBus] Failed to connect, falling back to in-memory:",
        err,
      );
      this.subscriber = null;
      this.publisher = null;
    }
  }

  async disconnect(): Promise<void> {
    await Promise.all([
      this.subscriber?.quit(),
      this.publisher?.quit(),
    ]);
    this.subscriber = null;
    this.publisher = null;
  }

  async publish(event: Omit<PlatformEvent, "id" | "timestamp">): Promise<void> {
    const fullEvent: PlatformEvent = {
      ...event,
      id: randomUUID(),
      timestamp: new Date().toISOString(),
    };

    this.metrics.published++;
    const start = Date.now();

    await this.publishLocal(fullEvent);

    if (this.publisher) {
      try {
        const channel = `${this.channelPrefix}${event.type}`;
        await this.publisher.publish(channel, JSON.stringify(fullEvent));
        await this.publisher.publish(
          `${this.channelPrefix}*`,
          JSON.stringify(fullEvent),
        );
      } catch {
        /* silent fallback */
      }
    }

    this.metrics.avgDeliveryMs =
      (this.metrics.avgDeliveryMs + (Date.now() - start)) / 2;
  }

  private async publishLocal(event: PlatformEvent): Promise<void> {
    const handlers = this.localHandlers.get(event.type);
    if (handlers) {
      for (const handler of handlers) {
        try {
          const result = handler(event);
          if (result instanceof Promise) await result;
          this.metrics.delivered++;
        } catch (err) {
          this.metrics.failed++;
          this.handleDeadLetter(event, err);
        }
      }
    }

    const wildcardHandlers = this.localHandlers.get("*");
    if (wildcardHandlers) {
      for (const handler of wildcardHandlers) {
        try {
          const result = handler(event);
          if (result instanceof Promise) await result;
          this.metrics.delivered++;
        } catch (err) {
          this.metrics.failed++;
        }
      }
    }
  }

  private handleDeadLetter(event: PlatformEvent, error: unknown): void {
    this.deadLetters.push({
      event,
      error: error instanceof Error ? error.message : String(error),
      retryCount: 0,
      maxRetries: 3,
      nextRetryAt: new Date(Date.now() + 5000).toISOString(),
      createdAt: new Date().toISOString(),
    });
    this.metrics.deadLettered++;
  }

  subscribe(type: string, handler: EventHandler<PlatformEvent>): () => void {
    if (!this.localHandlers.has(type)) {
      this.localHandlers.set(type, new Set());
    }
    this.localHandlers.get(type)!.add(handler);

    if (this.subscriber && !this.subscribedChannels.has(type)) {
      this.subscribedChannels.add(type);
      const channel = `${this.channelPrefix}${type}`;
      this.subscriber.subscribe(channel, (err) => {
        if (err)
          console.warn(
            `[RedisEventBus] Failed to subscribe to ${channel}:`,
            err,
          );
      });
      this.subscriber!.on("message", (ch, message) => {
        if (ch === channel || ch === `${this.channelPrefix}*`) {
          try {
            const event = JSON.parse(message) as PlatformEvent;
            this.publishLocal(event).catch(() => {});
          } catch {
            /* ignore parse errors */
          }
        }
      });
    }

    return () => {
      this.localHandlers.get(type)?.delete(handler);
    };
  }

  getDeadLetters(): DeadLetterEvent[] {
    return [...this.deadLetters];
  }

  getMetrics(): EventBusMetrics {
    return { ...this.metrics };
  }

  async health(): Promise<{ connected: boolean; latencyMs: number }> {
    const start = Date.now();
    const connected = this.publisher?.status === "ready";
    return { connected, latencyMs: Date.now() - start };
  }
}

export class NatsEventBus implements EventBus {
  private nc: any = null;
  private js: any = null;
  private handlers = new Map<string, Set<EventHandler<PlatformEvent>>>();
  private deadLetters: DeadLetterEvent[] = [];
  private metrics: EventBusMetrics = {
    published: 0,
    delivered: 0,
    failed: 0,
    deadLettered: 0,
    avgDeliveryMs: 0,
  };
  private connected = false;

  constructor(private natsUrl: string = "nats://localhost:4222") {}

  async connect(): Promise<void> {
    try {
      // @ts-ignore – nats is an optional peer dep
      const { connect, StringCodec } = await import("nats");
      this.nc = await connect({ servers: this.natsUrl });
      this.js = this.nc.jetstream();
      this.connected = true;
      console.log(`[NatsEventBus] Connected to ${this.natsUrl}`);
    } catch (err) {
      console.warn("[NatsEventBus] Failed to connect:", err);
      this.connected = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.nc) {
      await this.nc.drain();
      this.nc = null;
      this.js = null;
      this.connected = false;
    }
  }

  async publish(event: Omit<PlatformEvent, "id" | "timestamp">): Promise<void> {
    const fullEvent: PlatformEvent = {
      ...event,
      id: randomUUID(),
      timestamp: new Date().toISOString(),
    };

    this.metrics.published++;
    const start = Date.now();

    // Local handlers
    const localHandlers = this.handlers.get(event.type);
    if (localHandlers) {
      for (const handler of localHandlers) {
        try {
          const result = handler(fullEvent);
          if (result instanceof Promise) await result;
          this.metrics.delivered++;
        } catch (err) {
          this.metrics.failed++;
          this.handleDeadLetter(fullEvent, err);
        }
      }
    }

    const wildcardHandlers = this.handlers.get("*");
    if (wildcardHandlers) {
      for (const handler of wildcardHandlers) {
        try {
          const result = handler(fullEvent);
          if (result instanceof Promise) await result;
          this.metrics.delivered++;
        } catch (err) {
          this.metrics.failed++;
        }
      }
    }

    // NATS JetStream publish
    if (this.js && this.connected) {
      try {
        // @ts-ignore – nats is an optional peer dep
        const { StringCodec } = await import("nats");
        const sc = StringCodec();
        const subject = `longox.events.${event.type}`;
        await this.js.publish(subject, sc.encode(JSON.stringify(fullEvent)));
      } catch (err) {
        console.warn("[NatsEventBus] Publish failed:", err);
      }
    }

    this.metrics.avgDeliveryMs =
      (this.metrics.avgDeliveryMs + (Date.now() - start)) / 2;
  }

  private handleDeadLetter(event: PlatformEvent, error: unknown): void {
    this.deadLetters.push({
      event,
      error: error instanceof Error ? error.message : String(error),
      retryCount: 0,
      maxRetries: 3,
      nextRetryAt: new Date(Date.now() + 5000).toISOString(),
      createdAt: new Date().toISOString(),
    });
    this.metrics.deadLettered++;
  }

  subscribe(type: string, handler: EventHandler<PlatformEvent>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);

    // NATS subscription
    if (this.nc && this.connected) {
      const subject = `longox.events.${type}`;
      this.nc.subscribe(subject, {
        callback: async (err: any, msg: any) => {
          if (err) return;
          try {
            // @ts-ignore – nats is an optional peer dep
            const { StringCodec } = await import("nats");
            const sc = StringCodec();
            const event = JSON.parse(sc.decode(msg.data)) as PlatformEvent;
            const result = handler(event);
            if (result instanceof Promise) await result;
          } catch (err) {
            console.warn(`[NatsEventBus] Handler error for ${type}:`, err);
          }
        },
      });
    }

    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  getDeadLetters(): DeadLetterEvent[] {
    return [...this.deadLetters];
  }

  getMetrics(): EventBusMetrics {
    return { ...this.metrics };
  }

  async health(): Promise<{ connected: boolean; latencyMs: number }> {
    const start = Date.now();
    const connected = this.connected && !this.nc?.isClosed();
    return { connected, latencyMs: Date.now() - start };
  }
}

export const eventBus = new InMemoryEventBus();

export function initEventBus(
  type: "memory" | "redis" | "nats" = "memory",
  url?: string,
): EventBus {
  switch (type) {
    case "redis": {
      const bus = new RedisEventBus(url);
      bus.connect().catch(() => {});
      return bus;
    }
    case "nats": {
      const bus = new NatsEventBus(url);
      bus.connect().catch(() => {});
      return bus;
    }
    default:
      return eventBus;
  }
}

export function createEventBus(): EventBus {
  const busType = (process.env.EVENT_BUS_TYPE ?? "memory") as
    | "memory"
    | "redis"
    | "nats";
  const busUrl = process.env.EVENT_BUS_URL;
  return initEventBus(busType, busUrl);
}

export { InMemoryEventBus as LocalEventBus };
