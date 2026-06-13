import type { UsageRepository } from "../../domain/usage/usage-repository";
import type { BillingPeriod } from "../../domain/billing/billing.entity";
import { buildUsageBreakdown, round2 } from "../../domain/billing/pricing";

export class GetCurrentBillingQuery {
  constructor(private readonly repository: UsageRepository) {}

  async execute(tenantId: number): Promise<BillingPeriod> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    const events = await this.repository.getEventQuantities(
      tenantId,
      periodStart,
    );
    const usageBreakdown = buildUsageBreakdown(events);
    const totalAmount = usageBreakdown.reduce((s, l) => s + l.total, 0);

    return {
      start: periodStart.toISOString(),
      end: periodEnd.toISOString(),
      totalAmount: round2(totalAmount),
      usageBreakdown,
    };
  }
}
