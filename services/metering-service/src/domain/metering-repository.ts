import type {
  MeteringEvent,
  MeteringEventProps,
  EventType,
} from "./metering-event.entity";
import type {
  UsageAggregate,
  UsageAggregateProps,
  AggregatePeriod,
} from "./usage-aggregate.entity";

export interface MeteringRepository {
  recordEvent(
    props: Omit<MeteringEventProps, "id" | "createdAt">,
  ): Promise<MeteringEvent>;
  findEvents(
    tenantId: string,
    filters?: {
      eventType?: EventType;
      from?: Date;
      to?: Date;
      workflowId?: string;
      limit?: number;
    },
  ): Promise<MeteringEvent[]>;
  getAggregate(
    tenantId: string,
    eventType: string,
    period: AggregatePeriod,
    periodStart: Date,
  ): Promise<UsageAggregate | null>;
  upsertAggregate(
    props: Omit<UsageAggregateProps, "id" | "createdAt" | "updatedAt">,
  ): Promise<UsageAggregate>;
  getUsageSummary(
    tenantId: string,
    from: Date,
    to: Date,
  ): Promise<
    { eventType: string; totalQuantity: number; totalCount: number }[]
  >;
}
