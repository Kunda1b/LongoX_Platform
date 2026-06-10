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

export const eventBus = new InMemoryEventBus();
