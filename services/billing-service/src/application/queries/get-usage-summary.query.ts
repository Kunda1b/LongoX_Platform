import type { UsageRepository } from "../../domain/usage/usage-repository";
import type { UsageSummary } from "../../domain/billing/billing.entity";
import { priceFor, round2 } from "../../domain/billing/pricing";

export class GetUsageSummaryQuery {
  constructor(private readonly repository: UsageRepository) {}

  async execute(tenantId: number): Promise<UsageSummary> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const metrics = await this.repository.getMetrics(tenantId, monthStart);
    const monthEvents = await this.repository.getEventQuantities(
      tenantId,
      monthStart,
    );

    const cost = monthEvents.reduce(
      (sum, e) => sum + priceFor(e.eventType) * e.quantity,
      0,
    );

    return {
      ...metrics,
      currentPeriodCost: round2(cost),
      budgetLimit: 500,
    };
  }
}
