import type {
  UsageEvent,
  ListUsageEventsFilter,
  UsageEventQuantity,
  UsageMetrics,
} from "./usage-event.entity";

export interface UsageRepository {
  listEvents(
    tenantId: string,
    filter: ListUsageEventsFilter,
  ): Promise<UsageEvent[]>;
  getMetrics(tenantId: string, monthStart: Date): Promise<UsageMetrics>;
  getEventQuantities(
    tenantId: string,
    periodStart: Date,
    periodEnd?: Date,
  ): Promise<UsageEventQuantity[]>;
}
