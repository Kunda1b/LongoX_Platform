import { Router, type IRouter } from "express";
import { gte, desc } from "drizzle-orm";
import { db, executionsTable } from "@longox/db";
import { authorize, requireTenantContext } from "@longox/shared-rbac";

const router: IRouter = Router();

function clampDays(value: unknown): number {
  const days = Number(value ?? 14);
  if (!Number.isFinite(days)) return 14;
  return Math.min(Math.max(Math.trunc(days), 1), 90);
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

router.get("/analytics/executions", authorize("analytics.read"), requireTenantContext, async (req, res): Promise<void> => {
  const days = clampDays(req.query.days);
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - days + 1);

  const rows = await db
    .select()
    .from(executionsTable)
    .where(gte(executionsTable.startedAt, start))
    .orderBy(executionsTable.startedAt);

  const buckets = new Map<
    string,
    { date: string; total: number; success: number; failed: number }
  >();

  for (let offset = 0; offset < days; offset++) {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + offset);
    const key = dayKey(date);
    buckets.set(key, { date: key, total: 0, success: 0, failed: 0 });
  }

  for (const row of rows) {
    const key = dayKey(row.startedAt);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.total += 1;
    if (row.status === "success") bucket.success += 1;
    if (row.status === "failed") bucket.failed += 1;
  }

  res.json([...buckets.values()]);
});

router.get("/analytics/workflows", authorize("analytics.read"), requireTenantContext, async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(executionsTable)
    .orderBy(desc(executionsTable.startedAt));

  const stats = new Map<
    number,
    {
      workflowId: string;
      workflowName: string;
      total: number;
      success: number;
      failed: number;
      totalDurationMs: number;
      durationCount: number;
    }
  >();

  for (const row of rows) {
    const item =
      stats.get(row.workflowId) ??
      {
        workflowId: row.workflowId,
        workflowName: row.workflowName,
        total: 0,
        success: 0,
        failed: 0,
        totalDurationMs: 0,
        durationCount: 0,
      };
    item.workflowName = row.workflowName;
    item.total += 1;
    if (row.status === "success") item.success += 1;
    if (row.status === "failed") item.failed += 1;
    if (row.durationMs != null) {
      item.totalDurationMs += row.durationMs;
      item.durationCount += 1;
    }
    stats.set(row.workflowId, item);
  }

  res.json(
    [...stats.values()].map((item) => ({
      workflowId: item.workflowId,
      workflowName: item.workflowName,
      total: item.total,
      success: item.success,
      failed: item.failed,
      avgDurationMs:
        item.durationCount > 0
          ? Math.round(item.totalDurationMs / item.durationCount)
          : null,
    })),
  );
});

export default router;
