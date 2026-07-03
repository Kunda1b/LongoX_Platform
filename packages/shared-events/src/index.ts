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
  // ─── ADR §19.1 mandatory fields (architecture names) ───────────────────────
  // The architecture mandates these exact field names for the platform event
  // envelope. The original implementation used shortened names (`id`, `type`,
  // `version`, `timestamp`). To preserve backward compatibility while complying
  // with the architecture, we expose BOTH the architecture names (below) and
  // the legacy aliases (further below). New code MUST use the architecture names.
  /** Architecture: `event_id` — UUID, primary dedupe key, prefix `evt_`. */
  event_id: string;
  /** Architecture: `event_type` — dotted namespace.type. */
  event_type: PlatformEventType;
  /** Architecture: `event_version` — int, schema version of the payload. */
  event_version: number;
  /** Architecture: `occurred_at` — ISO 8601 UTC. */
  occurred_at: string;
  /** Architecture: `tenant_id` — prefix `tnt_`, nullable for platform-level. */
  tenant_id: string | null;
  /** Architecture: `correlation_id`. */
  correlation_id: string | null;
  /** Architecture: `aggregate_id`. */
  aggregate_id: string;
  /** Architecture: `actor_id` — prefix `usr_`. */
  actor_id: string | null;
  /** Architecture: `payload`. */
  payload: Record<string, unknown>;
  /** Architecture: `schema_url` — e.g. `https://schemas.longox.com/events/workflow.published.v2.json`. */
  schema_url: string;

  // ─── Legacy aliases (preserved for backward compat with existing services) ──
  /** @deprecated use `event_id`. */
  id: string;
  /** @deprecated use `event_type`. */
  type: PlatformEventType;
  /** @deprecated use `event_version`. */
  version: number;
  /** @deprecated use `occurred_at`. */
  timestamp: string;
  /** @deprecated use `tenant_id`. */
  tenantId?: string | null;
  /** @deprecated use `correlation_id`. */
  correlationId?: string | null;
  /** @deprecated use `aggregate_id`. */
  aggregateId: string;
  /** @deprecated use `actor_id`. */
  actorId?: string | null;
  /** Legacy field — kept for code that reads it. */
  aggregateType: string;
  /** Legacy field — kept for code that reads it. */
  actorType: "user" | "system" | "webhook" | "schedule";
  /** Legacy field — kept for code that reads it. */
  causationId: string | null;
  /** Legacy field — kept for code that reads it. */
  metadata: Record<string, unknown>;
}

export type EventHandler<T = unknown> = (event: T) => Promise<void> | void;

/**
 * Compute the canonical `schema_url` for an event type.
 *
 * Per architecture.md §19.1, every event carries a `schema_url` field pointing
 * to its JSON Schema (e.g. `https://schemas.longox.com/events/workflow.published.v2.json`).
 * The schemas are versioned and stored at `packages/shared-types/schemas/events/`.
 */
export function schemaUrlFor(type: PlatformEventType, version = 1): string {
  // Map the platform event type to the canonical schema file name.
  // The schema file naming convention is `<event-type>.v<version>.json`.
  const fileName = `${type}.v${version}.json`;
  return `https://schemas.longox.com/events/${fileName}`;
}

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
  options: { tenantId?: string | null; eventVersion?: number } = {},
): PlatformEvent {
  const id = randomUUID();
  const eventVersion = options.eventVersion ?? 1;
  return {
    // Architecture-compliant names
    event_id: id,
    event_type: type,
    event_version: eventVersion,
    occurred_at: new Date().toISOString(),
    tenant_id: options.tenantId ?? null,
    correlation_id: correlationId ?? null,
    aggregate_id: aggregateId,
    actor_id: actor.id ?? null,
    payload,
    schema_url: schemaUrlFor(type, eventVersion),

    // Legacy aliases
    id,
    type,
    version: eventVersion,
    timestamp: new Date().toISOString(),
    tenantId: options.tenantId ?? null,
    correlationId: correlationId ?? null,
    aggregateId,
    actorId: actor.id ?? null,
    aggregateType,
    actorType: actor.type ?? "system",
    causationId: causationId ?? null,
    metadata,
  };
}

// ─── ADR §19.1 — Mandatory event field validator ─────────────────────────────
// Per architecture.md §19.1 and §19.5, every platform event MUST carry the 9
// mandatory fields. This validator runs at build time (CI) and at runtime
// (before publish). An invalid event is rejected with a typed error so the
// caller can shape the response per the §13.3 error envelope.

export type EventValidationError = {
  field: string;
  reason: string;
};

export class EventValidationException extends Error {
  constructor(public readonly errors: EventValidationError[]) {
    super(
      `Event validation failed: ${errors.map((e) => `${e.field} (${e.reason})`).join(", ")}`,
    );
    this.name = "EventValidationException";
  }
}

/**
 * Validate that an event carries all 9 mandatory fields per §19.1.
 *
 * Mandatory fields:
 *   event_id (UUID, prefix evt_), event_type (dotted), event_version (int >0),
 *   occurred_at (ISO 8601 UTC), tenant_id (prefix tnt_ or null),
 *   correlation_id, aggregate_id, actor_id (prefix usr_ or null),
 *   payload (object), schema_url (URL).
 *
 * @returns `null` if valid, or an array of validation errors.
 */
export function validateEvent(
  event: Partial<PlatformEvent>,
): EventValidationError[] | null {
  const errors: EventValidationError[] = [];

  // event_id — UUID with optional evt_ prefix
  if (!event.event_id && !event.id) {
    errors.push({ field: "event_id", reason: "missing" });
  } else {
    const id = event.event_id ?? event.id ?? "";
    const uuidRe =
      /^(evt_)?[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRe.test(id)) {
      errors.push({
        field: "event_id",
        reason: "must be a UUID, optionally prefixed with evt_",
      });
    }
  }

  // event_type — dotted namespace.type
  const type = event.event_type ?? event.type;
  if (!type) {
    errors.push({ field: "event_type", reason: "missing" });
  } else if (!/^[a-z_]+\.[a-z_-]+$/i.test(type)) {
    errors.push({
      field: "event_type",
      reason: "must be dotted namespace.type (e.g. workflow.published)",
    });
  }

  // event_version — positive integer
  const version = event.event_version ?? event.version;
  if (version === undefined || version === null) {
    errors.push({ field: "event_version", reason: "missing" });
  } else if (!Number.isInteger(version) || version < 1) {
    errors.push({
      field: "event_version",
      reason: "must be a positive integer",
    });
  }

  // occurred_at — ISO 8601 UTC
  const occurredAt = event.occurred_at ?? event.timestamp;
  if (!occurredAt) {
    errors.push({ field: "occurred_at", reason: "missing" });
  } else if (Number.isNaN(Date.parse(occurredAt))) {
    errors.push({ field: "occurred_at", reason: "must be ISO 8601 UTC" });
  }

  // tenant_id — nullable, prefix tnt_ when present
  const tenantId = event.tenant_id ?? event.tenantId;
  if (tenantId !== null && tenantId !== undefined) {
    if (!/^tnt_[a-z0-9_-]+$/i.test(String(tenantId))) {
      errors.push({
        field: "tenant_id",
        reason: "must be null or prefixed with tnt_",
      });
    }
  }

  // correlation_id — present (may be null)
  if (event.correlation_id === undefined && event.correlationId === undefined) {
    errors.push({
      field: "correlation_id",
      reason: "missing (set to null if no correlation)",
    });
  }

  // aggregate_id — required
  const aggregateId = event.aggregate_id ?? event.aggregateId;
  if (!aggregateId) {
    errors.push({ field: "aggregate_id", reason: "missing" });
  }

  // actor_id — nullable, prefix usr_ when present
  const actorId = event.actor_id ?? event.actorId;
  if (actorId !== null && actorId !== undefined) {
    if (!/^(usr_|system|webhook|schedule)/i.test(String(actorId))) {
      errors.push({
        field: "actor_id",
        reason:
          "must be null, prefixed with usr_, or one of: system, webhook, schedule",
      });
    }
  }

  // payload — object
  if (event.payload === undefined) {
    errors.push({
      field: "payload",
      reason: "missing (set to {} if no payload)",
    });
  } else if (
    typeof event.payload !== "object" ||
    Array.isArray(event.payload)
  ) {
    errors.push({ field: "payload", reason: "must be a JSON object" });
  }

  // schema_url — required, must be a URL
  if (!event.schema_url) {
    errors.push({
      field: "schema_url",
      reason: "missing (use schemaUrlFor() to compute the canonical URL)",
    });
  } else {
    try {
      // eslint-disable-next-line no-new
      new URL(event.schema_url);
    } catch {
      errors.push({ field: "schema_url", reason: "must be a valid URL" });
    }
  }

  return errors.length === 0 ? null : errors;
}

/**
 * Assert that an event is valid; throw EventValidationException if not.
 *
 * Use this at the boundary of every event publisher to fail fast on invalid
 * events. The CI build-time check (per §19.1) calls this against the event
 * schema fixtures in `packages/shared-types/schemas/events/`.
 */
export function assertEventValid(event: Partial<PlatformEvent>): void {
  const errors = validateEvent(event);
  if (errors) {
    throw new EventValidationException(errors);
  }
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
    await Promise.all([this.subscriber?.quit(), this.publisher?.quit()]);
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
