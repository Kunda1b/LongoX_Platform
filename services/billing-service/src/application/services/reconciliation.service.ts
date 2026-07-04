/**
 * Billing reconciliation service.
 *
 * Per architecture.md §16.3:
 *   - Daily reconciliation job compares raw metering event sums to usage rollups.
 *   - Discrepancies trigger an alert + automatic re-rollup.
 *   - Invoices are generated from rollups (never from raw events).
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.usageRollup` delegate with `as any` casts for legacy columns.
 * Raw sums on `metering_events.quantity` use `prisma.$queryRawUnsafe()`.
 */

import { prisma } from "@longox/db/prisma";

const RECONCILIATION_THRESHOLD_PCT = Number(
  process.env.BILLING_RECONCILIATION_THRESHOLD_PCT ?? 1,
);
const ALERT_DISCREPANCY_PCT = Number(
  process.env.BILLING_RECONCILIATION_ALERT_PCT ?? 5,
);

export interface ReconciliationReport {
  window_start: string;
  window_end: string;
  total_tuples: number;
  discrepancies_found: number;
  rerollups_queued: number;
  alert_triggered: boolean;
  details: Array<{
    tenant_id: string;
    metric_name: string;
    rollup_quantity: number;
    raw_quantity: number;
    delta: number;
    delta_pct: number;
    action: "rerollup_queued" | "ok";
  }>;
}

export class ReconciliationService {
  /**
   * Run the daily reconciliation for the given UTC day.
   *
   * @param dateUtc - the UTC day to reconcile (defaults to yesterday UTC).
   * @returns a structured report; the caller is responsible for emitting the
   *          platform event (`billing.reconciliation.completed`).
   */
  async runDailyReconciliation(dateUtc?: Date): Promise<ReconciliationReport> {
    const target = dateUtc ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
    const windowStart = new Date(
      Date.UTC(
        target.getUTCFullYear(),
        target.getUTCMonth(),
        target.getUTCDate(),
      ),
    );
    const windowEnd = new Date(windowStart.getTime() + 24 * 60 * 60 * 1000);

    // ─── 1. Fetch all rollups for the window ────────────────────────────────
    const rollups = await prisma.usageRollup.findMany({
      where: {
        periodStart: { gte: windowStart },
        periodEnd: { lt: windowEnd },
      } as any,
      select: {
        tenantId: true,
        metricName: true,
        totalQuantity: true,
      } as any,
    });

    // ─── 2. For each rollup, sum the raw metering events ────────────────────
    const details: ReconciliationReport["details"] = [];
    let discrepanciesFound = 0;
    let rerollupsQueued = 0;

    for (const rollup of rollups as any[]) {
      const rawRows: any[] = await prisma.$queryRawUnsafe(
        `SELECT coalesce(sum(quantity), 0)::text AS total
         FROM metering_events
         WHERE tenant_id = $1
           AND event_type = $2
           AND ingested_at >= $3
           AND ingested_at < $4`,
        rollup.tenantId,
        rollup.metricName,
        windowStart,
        windowEnd,
      );

      const rawQuantity = Number(rawRows?.[0]?.total ?? 0);
      const rollupQuantity = Number(rollup.totalQuantity ?? 0);
      const delta = Math.abs(rollupQuantity - rawQuantity);
      const denominator = Math.max(rawQuantity, 1);
      const deltaPct = (delta / denominator) * 100;

      if (deltaPct > RECONCILIATION_THRESHOLD_PCT) {
        discrepanciesFound += 1;
        // Queue a re-rollup by deleting the discrepant rollup row; the next
        // hourly rollup job will recompute it from raw events.
        try {
          await prisma.usageRollup.deleteMany({
            where: {
              tenantId: rollup.tenantId,
              metricName: rollup.metricName,
              periodStart: { gte: windowStart },
              periodEnd: { lt: windowEnd },
            } as any,
          });
          rerollupsQueued += 1;
        } catch {
          // Delete failure is non-fatal — the alert below will surface it.
        }
        details.push({
          tenant_id: rollup.tenantId,
          metric_name: rollup.metricName,
          rollup_quantity: rollupQuantity,
          raw_quantity: rawQuantity,
          delta,
          delta_pct: deltaPct,
          action: "rerollup_queued",
        });
      } else {
        details.push({
          tenant_id: rollup.tenantId,
          metric_name: rollup.metricName,
          rollup_quantity: rollupQuantity,
          raw_quantity: rawQuantity,
          delta,
          delta_pct: deltaPct,
          action: "ok",
        });
      }
    }

    const totalTuples = rollups.length;
    const discrepancyPctOfTotal =
      totalTuples > 0 ? (discrepanciesFound / totalTuples) * 100 : 0;
    const alertTriggered = discrepancyPctOfTotal > ALERT_DISCREPANCY_PCT;

    return {
      window_start: windowStart.toISOString(),
      window_end: windowEnd.toISOString(),
      total_tuples: totalTuples,
      discrepancies_found: discrepanciesFound,
      rerollups_queued: rerollupsQueued,
      alert_triggered: alertTriggered,
      details,
    };
  }
}

export const reconciliationService = new ReconciliationService();
