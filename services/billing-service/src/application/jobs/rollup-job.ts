/**
 * `billing-rollup` queue job processor.
 *
 * ADR-001 / architecture.md §11 — the `billing-rollup` queue hosts jobs that
 * aggregate raw `metering_events` into `usage_rollups` rows. Jobs are produced
 * by the scheduler (hourly/daily cron) and by the metering-service flush path.
 *
 * This processor delegates to the existing `UsageRollupService` so the rollup
 * business logic lives in exactly one place. It is exported from
 * `@longox/billing-service` so the execution-service worker (which drains all
 * queues in dev/single-process mode) can import and dispatch real work instead
 * of the placeholder no-op it had previously.
 */

import type { BillingRollupJobData } from "@longox/shared-queue";
import { logger } from "@longox/shared-logger";
import { UsageRollupService } from "../services/usage-rollup.service";

const usageRollupService = new UsageRollupService();

export interface RollupJobResult {
  tenantId: string | null;
  rolledUp: boolean;
}

/**
 * Process a `billing-rollup` job.
 *
 * Accepts the BullMQ job's `data` payload directly. Two modes:
 *   - `tenantId` set     → roll up the given tenant (daily + monthly).
 *   - `tenantId` omitted → log a warning and exit (multi-tenant sweep is the
 *                          scheduler's responsibility; it enqueues one job
 *                          per tenant so this branch is a defensive no-op).
 */
export async function processBillingRollupJob(
  data: BillingRollupJobData,
): Promise<RollupJobResult> {
  const tenantId = data?.tenantId;
  const periodStart = data?.periodStart
    ? new Date(data.periodStart)
    : undefined;

  if (!tenantId) {
    logger.warn(
      { data },
      "[billing-rollup] job missing tenantId — multi-tenant sweep should be split into per-tenant jobs",
    );
    return { tenantId: null, rolledUp: false };
  }

  logger.info({ tenantId, periodStart }, "[billing-rollup] running rollup");

  if (periodStart) {
    await usageRollupService.rollupDaily(tenantId, periodStart);
  } else {
    await usageRollupService.rollupAll(tenantId);
  }

  return { tenantId, rolledUp: true };
}
