import type { UsageRepository } from "../../domain/usage/usage-repository";
import type {
  UsageEvent,
  ListUsageEventsFilter,
} from "../../domain/usage/usage-event.entity";

export class ListUsageEventsQuery {
  constructor(private readonly repository: UsageRepository) {}

  async execute(filter: ListUsageEventsFilter): Promise<UsageEvent[]> {
    return this.repository.listEvents(filter);
  }
}
