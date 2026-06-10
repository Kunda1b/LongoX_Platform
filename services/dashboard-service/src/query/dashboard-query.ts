import { sql, desc } from "drizzle-orm";
import { db, executionsTable, workflowsTable } from "@longox/db";

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
  const rows = await db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${executionsTable.startedAt}), 'YYYY-MM-DD')`,
      value: sql<number>`count(*)::int`,
    })
    .from(executionsTable)
    .groupBy(sql`date_trunc('day', ${executionsTable.startedAt})`)
    .orderBy(sql`date_trunc('day', ${executionsTable.startedAt})`)
    .limit(30);
  return rows.map((r) => ({ label: r.day, value: r.value }));
}

async function executionsByStatus(): Promise<QueryDataPoint[]> {
  const rows = await db
    .select({
      label: executionsTable.status,
      value: sql<number>`count(*)::int`,
    })
    .from(executionsTable)
    .groupBy(executionsTable.status);
  return rows.map((r) => ({ label: r.label, value: r.value }));
}

async function workflowStatusBreakdown(): Promise<QueryDataPoint[]> {
  const rows = await db
    .select({
      label: workflowsTable.status,
      value: sql<number>`count(*)::int`,
    })
    .from(workflowsTable)
    .groupBy(workflowsTable.status);
  return rows.map((r) => ({ label: r.label, value: r.value }));
}

async function topWorkflows(): Promise<QueryDataPoint[]> {
  const rows = await db
    .select({
      label: executionsTable.workflowName,
      value: sql<number>`count(*)::int`,
    })
    .from(executionsTable)
    .groupBy(executionsTable.workflowName)
    .orderBy(desc(sql`count(*)`))
    .limit(10);
  return rows.map((r) => ({ label: r.label, value: r.value }));
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
