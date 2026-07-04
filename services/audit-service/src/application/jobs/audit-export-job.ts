/**
 * `audit-export` queue job processor.
 *
 * ADR-001 / architecture.md §11 — the `audit-export` queue hosts jobs that
 * generate an audit-log export (CSV or JSON) for a tenant and upload it to
 * object storage. The export is asynchronously produced because exporting
 * years of audit entries can take minutes.
 *
 * The full export business logic lives in `compliance-service`'s
 * `AuditExportService`; this placeholder is exported from `audit-service`
 * so the execution-service BullMQ worker (which drains all queues in dev
 * mode) can dispatch real work to it. Once the `AuditExportService` is
 * constructable without an HTTP request context we can call it from here
 * directly.
 */

import type { AuditExportJobData } from "@longox/shared-queue";

export interface AuditExportJobResult {
  exportId: string | null;
  tenantId: string | null;
  format: "json" | "csv" | null;
  exported: boolean;
}

export async function processAuditExportJob(
  data: AuditExportJobData,
): Promise<AuditExportJobResult> {
  const exportId = data?.exportId ?? null;
  const tenantId = data?.tenantId ?? null;
  const format = data?.format ?? null;

  // TODO(longox-platform#P1-9): wire to compliance-service's
  // AuditExportService once it's constructable without an HTTP request
  // context. For now this is a logged placeholder so the `audit-export`
  // queue can be drained safely in dev mode.
  console.log(
    `[audit-export] placeholder job exportId=${exportId} tenantId=${tenantId} format=${format}`,
  );

  return { exportId, tenantId, format: format ?? null, exported: false };
}
