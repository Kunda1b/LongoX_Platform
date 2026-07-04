export type AggregatePeriod = "hour" | "day" | "month";

export interface UsageAggregateProps {
  id: string;
  tenantId: string;
  eventType: string;
  period: AggregatePeriod;
  periodStart: Date;
  periodEnd: Date;
  totalQuantity: number;
  totalCount: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class UsageAggregate {
  constructor(private props: UsageAggregateProps) {}

  get id(): string {
    return this.props.id;
  }
  get tenantId(): string {
    return this.props.tenantId;
  }
  get eventType(): string {
    return this.props.eventType;
  }
  get period(): AggregatePeriod {
    return this.props.period;
  }
  get periodStart(): Date {
    return this.props.periodStart;
  }
  get totalQuantity(): number {
    return this.props.totalQuantity;
  }
  get totalCount(): number {
    return this.props.totalCount;
  }

  addUsage(quantity: number): void {
    this.props.totalQuantity += quantity;
    this.props.totalCount += 1;
    this.props.updatedAt = new Date();
  }

  toJSON() {
    return { ...this.props };
  }
}
