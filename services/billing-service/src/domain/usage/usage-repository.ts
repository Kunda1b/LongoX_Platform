import type {
  UsageEvent,
  ListUsageEventsFilter,
  UsageEventQuantity,
  UsageMetrics,
} from "./usage-event.entity";

export interface UsageRepository {
  listEvents(filter: ListUsageEventsFilter): Promise<UsageEvent[]>;
  getMetrics(monthStart: Date): Promise<UsageMetrics>;
  getEventQuantities(
    periodStart: Date,
    periodEnd?: Date,
  ): Promise<UsageEventQuantity[]>;
}
