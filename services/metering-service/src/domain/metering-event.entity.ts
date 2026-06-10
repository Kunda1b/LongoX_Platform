export type EventType =
  | "workflow.run"
  | "workflow.node"
  | "connector.call"
  | "ai.token"
  | "ai.completion"
  | "storage.used"
  | "marketplace.install"
  | "api.call"
  | "webhook.received"
  | "user.seat";

export interface MeteringEventProps {
  id: number;
  tenantId: number;
  eventType: EventType;
  quantity: number;
  unit: string;
  metadata: Record<string, unknown>;
  source: string;
  sourceId?: string;
  workflowId?: number;
  executionId?: number;
  timestamp: Date;
  createdAt: Date;
}

export class MeteringEvent {
  constructor(private props: MeteringEventProps) {}

  get id(): number {
    return this.props.id;
  }
  get tenantId(): number {
    return this.props.tenantId;
  }
  get eventType(): EventType {
    return this.props.eventType;
  }
  get quantity(): number {
    return this.props.quantity;
  }
  get unit(): string {
    return this.props.unit;
  }
  get source(): string {
    return this.props.source;
  }
  get workflowId(): number | undefined {
    return this.props.workflowId;
  }
  get timestamp(): Date {
    return this.props.timestamp;
  }

  toJSON() {
    return { ...this.props };
  }
}
