export type PlatformEventType =
  | "workflow.created"
  | "workflow.updated"
  | "workflow.deleted"
  | "workflow.published"
  | "workflow.promoted"
  | "execution.started"
  | "execution.completed"
  | "execution.failed"
  | "execution.retried"
  | "connector.installed"
  | "connector.uninstalled"
  | "user.login"
  | "user.created"
  | "tenant.created"
  | "billing.updated"
  | "template.published"
  | "dashboard.published";

export interface PlatformEvent {
  id: string;
  type: PlatformEventType;
  aggregateId: string;
  aggregateType: string;
  payload: Record<string, unknown>;
  actorId: string | null;
  actorType: string;
  correlationId: string | null;
  timestamp: string;
}

export interface EventHandler<T = unknown> {
  (event: T): Promise<void> | void;
}

export interface EventBus {
  publish(event: Omit<PlatformEvent, "id" | "timestamp">): Promise<void>;
  subscribe<T>(eventType: string, handler: EventHandler<T>): () => void;
}
