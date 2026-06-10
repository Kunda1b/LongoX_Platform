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
    tenantId: number,
    filters?: {
      eventType?: EventType;
      from?: Date;
      to?: Date;
      workflowId?: number;
      limit?: number;
    },
  ): Promise<MeteringEvent[]>;
  getAggregate(
    tenantId: number,
    eventType: string,
    period: AggregatePeriod,
    periodStart: Date,
  ): Promise<UsageAggregate | null>;
  upsertAggregate(
    props: Omit<UsageAggregateProps, "id" | "createdAt" | "updatedAt">,
  ): Promise<UsageAggregate>;
  getUsageSummary(
    tenantId: number,
    from: Date,
    to: Date,
  ): Promise<
    { eventType: string; totalQuantity: number; totalCount: number }[]
  >;
}
