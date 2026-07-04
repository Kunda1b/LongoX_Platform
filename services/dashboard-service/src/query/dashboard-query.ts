/**
 * Dashboard analytics query helpers.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3. Raw SQL aggregations
 * are executed via `prisma.$queryRawUnsafe()` (per ADR-013 raw-SQL fallback
 * pattern). Field references use the underlying Postgres column names
 * (`started_at`, `status`, `workflow_name`) since these run against the
 * `workflow_executions` and `workflows` tables directly.
 */

import { prisma } from "@longox/db/prisma";

export type DashboardMetric =
  | "executions_over_time"
  | "workflow_status_breakdown"
  | "executions_by_status"
  | "top_workflows";

export const SUPPORTED_METRICS: DashboardMetric[] = [
  "executions_over_time",
  "workflow_status_breakdown",
  "executions_by_status",
  "top_workflows",
];

export interface QueryDataPoint {
  label: string;
  value: number;
}

export interface DashboardQueryResult {
  metric: DashboardMetric;
  series: QueryDataPoint[];
}

async function executionsOverTime(): Promise<QueryDataPoint[]> {
  const rows = await prisma.$queryRawUnsafe<{ day: string; value: number }[]>(`
    SELECT to_char(date_trunc('day', started_at), 'YYYY-MM-DD') AS day,
           count(*)::int AS value
    FROM workflow_executions
    GROUP BY date_trunc('day', started_at)
    ORDER BY date_trunc('day', started_at)
    LIMIT 30
  `);
  return rows.map((r) => ({ label: r.day, value: Number(r.value) }));
}

async function executionsByStatus(): Promise<QueryDataPoint[]> {
  const rows = await prisma.$queryRawUnsafe<{ label: string; value: number }[]>(`
    SELECT status AS label, count(*)::int AS value
    FROM workflow_executions
    GROUP BY status
  `);
  return rows.map((r) => ({ label: r.label, value: Number(r.value) }));
}

async function workflowStatusBreakdown(): Promise<QueryDataPoint[]> {
  const rows = await prisma.$queryRawUnsafe<{ label: string; value: number }[]>(`
    SELECT status AS label, count(*)::int AS value
    FROM workflows
    GROUP BY status
  `);
  return rows.map((r) => ({ label: r.label, value: Number(r.value) }));
}

async function topWorkflows(): Promise<QueryDataPoint[]> {
  const rows = await prisma.$queryRawUnsafe<{ label: string; value: number }[]>(`
    SELECT workflow_name AS label, count(*)::int AS value
    FROM workflow_executions
    WHERE workflow_name IS NOT NULL
    GROUP BY workflow_name
    ORDER BY count(*) DESC
    LIMIT 10
  `);
  return rows.map((r) => ({ label: r.label, value: Number(r.value) }));
}

export async function runDashboardQuery(
  metric: DashboardMetric,
): Promise<DashboardQueryResult> {
  let series: QueryDataPoint[];
  switch (metric) {
    case "executions_over_time":
      series = await executionsOverTime();
      break;
    case "workflow_status_breakdown":
      series = await workflowStatusBreakdown();
      break;
    case "executions_by_status":
      series = await executionsByStatus();
      break;
    case "top_workflows":
      series = await topWorkflows();
      break;
  }
  return { metric, series };
}
