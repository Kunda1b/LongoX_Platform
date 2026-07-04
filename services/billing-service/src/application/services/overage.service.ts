/**
 * Overage service.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.billingAccount`, `prisma.billingPlan`, `prisma.overageEvent`,
 * `prisma.invoiceLine` delegates with `as any` casts for legacy columns.
 *
 * Raw aggregations on `overage_events` use `prisma.$queryRawUnsafe()` because
 * of the `sum(numeric)::text` casts.
 */

import { prisma } from "@longox/db/prisma";

export interface OverageCharge {
  resource: string;
  overageQuantity: string;
  rate: string;
  amount: string;
}

export class OverageService {
  async track(
    tenantId: string,
    resource: string,
    overageQuantity: number,
  ): Promise<void> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const account = await prisma.billingAccount.findFirst({
      where: { tenantId } as any,
    });

    let rate = 0;
    if ((account as any)?.planId) {
      const plan = await prisma.billingPlan.findUnique({
        where: { id: (account as any).planId },
      });

      if (plan) {
        if (resource === "executions" || resource === "workflow.execution") {
          rate = Number(plan.overageExecutionsPrice);
        } else if (resource === "ai_tokens" || resource === "ai.token") {
          rate = Number(plan.overageAiTokensPrice);
        }
      }
    }

    const amount = overageQuantity * rate;

    await prisma.overageEvent.create({
      data: {
        tenantId,
        resource,
        overageQuantity,
        rate,
        amount,
        periodStart,
        periodEnd,
        metadata: {},
      } as any,
    });
  }

  async getOverageCharges(
    tenantId: string,
    period: { start: Date; end: Date },
  ): Promise<OverageCharge[]> {
    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT resource,
              sum(overage_quantity::numeric)::text AS "overageQuantity",
              rate::text,
              sum(amount::numeric)::text AS amount
       FROM overage_events
       WHERE tenant_id = $1
         AND period_start >= $2
         AND period_end <= $3
       GROUP BY resource, rate`,
      tenantId,
      period.start,
      period.end,
    );

    return rows.map((r) => ({
      resource: r.resource,
      overageQuantity: r.overageQuantity,
      rate: r.rate,
      amount: r.amount,
    }));
  }

  async createOverageInvoiceLines(
    tenantId: string,
    period: { start: Date; end: Date },
  ): Promise<void> {
    const charges = await this.getOverageCharges(tenantId, period);

    for (const charge of charges) {
      await prisma.invoiceLine.create({
        data: {
          invoiceId: `overage-${tenantId}-${period.start.toISOString().slice(0, 7)}`,
          tenantId,
          lineType: "overage",
          description: `Overage charge for ${charge.resource}`,
          quantity: Number(charge.overageQuantity),
          unitPrice: Number(charge.rate),
          amount: Number(charge.amount),
          currency: "usd",
          periodStart: period.start,
          periodEnd: period.end,
          sourceEventIds: [],
        } as any,
      });
    }
  }
}
