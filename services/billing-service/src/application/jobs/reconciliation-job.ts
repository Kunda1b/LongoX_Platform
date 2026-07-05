/**
 * `billing-reconciliation` queue job processor.
 *
 * ADR-001 / architecture.md §11, §16.3 — the `billing-reconciliation` queue
 * hosts the daily reconciliation job that compares raw `metering_events`
 * totals to `usage_rollups` rows. Discrepancies trigger an alert + automatic
 * re-rollup. Invoices are generated from rollups (never from raw events).
 *
 * This processor delegates to the existing `ReconciliationService` so the
 * reconciliation business logic lives in exactly one place. It is exported
 * from `@longox/billing-service` so the execution-service worker (which
 * drains all queues in dev/single-process mode) can import and dispatch real
 * work instead of the placeholder no-op it had previously.
 */

import type { BillingReconciliationJobData } from "@longox/shared-queue";
import { logger } from "@longox/shared-logger";
import {
  ReconciliationService,
  type ReconciliationReport,
} from "../services/reconciliation.service";

const reconciliationService = new ReconciliationService();

export interface ReconciliationJobResult {
  report: ReconciliationReport;
  alertTriggered: boolean;
}

/**
 * Process a `billing-reconciliation` job.
 *
 * Accepts the BullMQ job's `data` payload directly. The optional `rollupId`
 * field is reserved for future single-rollup reconciliation; today we always
 * reconcile the full UTC day (defaulting to yesterday UTC).
 */
export async function processBillingReconciliationJob(
  data: BillingReconciliationJobData,
): Promise<ReconciliationJobResult> {
  logger.info(
    { tenantId: data?.tenantId, rollupId: data?.rollupId },
    "[billing-reconciliation] running daily reconciliation",
  );

  const report = await reconciliationService.runDailyReconciliation();

  logger.info(
    {
      windowStart: report.window_start,
      windowEnd: report.window_end,
      discrepancies: report.discrepancies_found,
      rerollupsQueued: report.rerollups_queued,
      alertTriggered: report.alert_triggered,
    },
    "[billing-reconciliation] reconciliation complete",
  );

  return { report, alertTriggered: report.alert_triggered };
}
