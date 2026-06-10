import type { UsageRepository } from "../../domain/usage/usage-repository";
import type { Invoice } from "../../domain/billing/billing.entity";
import { buildUsageBreakdown, round2 } from "../../domain/billing/pricing";

export class ListInvoicesQuery {
  constructor(private readonly repository: UsageRepository) {}

  async execute(): Promise<Invoice[]> {
    const now = new Date();
    const invoices: Invoice[] = [];

    for (let i = 1; i <= 3; i++) {
      const periodStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const periodEnd = new Date(
        now.getFullYear(),
        now.getMonth() - i + 1,
        0,
        23,
        59,
        59,
      );

      const events = await this.repository.getEventQuantities(
        periodStart,
        periodEnd,
      );
      const lineItems = buildUsageBreakdown(events);
      const total = lineItems.reduce((s, l) => s + l.total, 0);

      invoices.push({
        id: i,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        totalAmount: round2(total),
        status: i === 1 ? "pending" : "paid",
        lineItems,
        createdAt: periodEnd.toISOString(),
      });
    }

    return invoices;
  }
}
