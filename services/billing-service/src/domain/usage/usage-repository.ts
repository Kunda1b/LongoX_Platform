import type {
  UsageEvent,
  ListUsageEventsFilter,
  UsageEventQuantity,
  UsageMetrics,
} from "./usage-event.entity";

export interface UsageRepository {
  listEvents(
    tenantId: number,
    filter: ListUsageEventsFilter,
  ): Promise<UsageEvent[]>;
  getMetrics(tenantId: number, monthStart: Date): Promise<UsageMetrics>;
  getEventQuantities(
    tenantId: number,
    periodStart: Date,
    periodEnd?: Date,
  ): Promise<UsageEventQuantity[]>;
}
