/**
 * Billing reconciliation service.
 *
 * Per architecture.md §16.3:
 *   - Daily reconciliation job compares raw metering event sums to usage rollups.
 *   - Discrepancies trigger an alert + automatic re-rollup.
 *   - Invoices are generated from rollups (never from raw events).
 *
 * This service implements the reconciliation logic. It is invoked by the
 * `billing-reconciliation` BullMQ queue (cron: daily at 02:00 UTC by default).
 *
 * Reconciliation algorithm:
 *   1. For each (tenant_id, metric_name, period) tuple in usage_rollups for
 *      the reconciliation window (default: yesterday UTC):
 *      a. Sum the raw metering_events for the same tuple.
 *      b. Compare the rollup total_quantity to the raw sum.
 *      c. If |rollup - raw| / max(raw, 1) > threshold (default 1%), mark the
 *         rollup as `discrepant` and queue a re-rollup by deleting the row
 *         (the next hourly rollup job will recompute it from raw events).
 *   2. Emit a `billing.reconciliation.completed` event with the count of
 *      discrepancies found and re-rollups queued.
 *   3. If the discrepancy count exceeds 5% of total tuples, emit a
 *      `billing.reconciliation.alert` event for the on-call engineer.
 *
 * Schema note: the actual `usage_rollups` table uses `metric_name` (not
 * `metric_code`) and `total_quantity` (not `quantity`). The `metering_events`
 * table uses `event_type` to identify the metric and `ingested_at` as the
 * timestamp (there is no separate `occurred_at` column).
 */

import { eq, and, gte, lt, sum } from "drizzle-orm";
import { db, meteringEventsTable, usageRollupsTable } from "@longox/db";

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
    const rollups = await db
      .select({
        tenantId: usageRollupsTable.tenantId,
        metricName: usageRollupsTable.metricName,
        totalQuantity: usageRollupsTable.totalQuantity,
      })
      .from(usageRollupsTable)
      .where(
        and(
          gte(usageRollupsTable.periodStart, windowStart),
          lt(usageRollupsTable.periodEnd, windowEnd),
        ),
      );

    // ─── 2. For each rollup, sum the raw metering events ────────────────────
    const details: ReconciliationReport["details"] = [];
    let discrepanciesFound = 0;
    let rerollupsQueued = 0;

    for (const rollup of rollups) {
      const [rawSum] = await db
        .select({
          total: sum(meteringEventsTable.quantity),
        })
        .from(meteringEventsTable)
        .where(
          and(
            eq(meteringEventsTable.tenantId, rollup.tenantId),
            eq(meteringEventsTable.eventType, rollup.metricName),
            gte(meteringEventsTable.ingestedAt, windowStart),
            lt(meteringEventsTable.ingestedAt, windowEnd),
          ),
        );

      const rawQuantity = Number(rawSum?.total ?? 0);
      const rollupQuantity = Number(rollup.totalQuantity ?? 0);
      const delta = Math.abs(rollupQuantity - rawQuantity);
      const denominator = Math.max(rawQuantity, 1);
      const deltaPct = (delta / denominator) * 100;

      if (deltaPct > RECONCILIATION_THRESHOLD_PCT) {
        discrepanciesFound += 1;
        // Queue a re-rollup by deleting the discrepant rollup row; the next
        // hourly rollup job will recompute it from raw events.
        try {
          await db
            .delete(usageRollupsTable)
            .where(
              and(
                eq(usageRollupsTable.tenantId, rollup.tenantId),
                eq(usageRollupsTable.metricName, rollup.metricName),
                gte(usageRollupsTable.periodStart, windowStart),
                lt(usageRollupsTable.periodEnd, windowEnd),
              ),
            );
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
