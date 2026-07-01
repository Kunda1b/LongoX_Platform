import {
  db,
  billingAccountsTable,
  billingPlansTable,
  overageEventsTable,
  invoiceLinesTable,
} from "@longox/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import type { InsertOverageEvent } from "@longox/db";

export interface OverageCharge {
  resource: string;
  overageQuantity: string;
  rate: string;
  amount: string;
}

export class OverageService {
  async track(
    tenantId: number,
    resource: string,
    overageQuantity: number,
  ): Promise<void> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [account] = await db
      .select()
      .from(billingAccountsTable)
      .where(eq(billingAccountsTable.tenantId, tenantId))
      .limit(1);

    let rate = 0;
    if (account?.planId) {
      const [plan] = await db
        .select()
        .from(billingPlansTable)
        .where(eq(billingPlansTable.id, account.planId))
        .limit(1);

      if (plan) {
        if (resource === "executions" || resource === "workflow.execution") {
          rate = Number(plan.overageExecutionsPrice);
        } else if (resource === "ai_tokens" || resource === "ai.token") {
          rate = Number(plan.overageAiTokensPrice);
        }
      }
    }

    const amount = overageQuantity * rate;

    const value: InsertOverageEvent = {
      tenantId,
      resource,
      overageQuantity: String(overageQuantity),
      rate: String(rate),
      amount: String(amount),
      periodStart,
      periodEnd,
      metadata: {},
    };

    await db.insert(overageEventsTable).values(value);
  }

  async getOverageCharges(
    tenantId: number,
    period: { start: Date; end: Date },
  ): Promise<OverageCharge[]> {
    const rows = await db
      .select({
        resource: overageEventsTable.resource,
        overageQuantity: sql<string>`sum(${overageEventsTable.overageQuantity}::numeric)`,
        rate: overageEventsTable.rate,
        amount: sql<string>`sum(${overageEventsTable.amount}::numeric)`,
      })
      .from(overageEventsTable)
      .where(
        and(
          eq(overageEventsTable.tenantId, tenantId),
          gte(overageEventsTable.periodStart, period.start),
          lte(overageEventsTable.periodEnd, period.end),
        ),
      )
      .groupBy(overageEventsTable.resource, overageEventsTable.rate);

    return rows;
  }

  async createOverageInvoiceLines(
    tenantId: number,
    period: { start: Date; end: Date },
  ): Promise<void> {
    const charges = await this.getOverageCharges(tenantId, period);

    for (const charge of charges) {
      await db.insert(invoiceLinesTable).values({
        invoiceId: `overage-${tenantId}-${period.start.toISOString().slice(0, 7)}`,
        tenantId,
        lineType: "overage",
        description: `Overage charge for ${charge.resource}`,
        quantity: charge.overageQuantity,
        unitPrice: charge.rate,
        amount: charge.amount,
        currency: "usd",
        periodStart: period.start,
        periodEnd: period.end,
        sourceEventIds: [],
      });
    }
  }
}
