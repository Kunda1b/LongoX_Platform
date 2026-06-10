export interface DashboardTemplateComponent {
  componentId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  config: Record<string, unknown>;
}

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  category: "operations" | "analytics" | "executive";
  components: DashboardTemplateComponent[];
}

export const DASHBOARD_TEMPLATE_CATALOG: DashboardTemplate[] = [
  {
    id: "operations-overview",
    name: "Operations Overview",
    description: "Workflow health, execution volume, and recent failures.",
    category: "operations",
    components: [
      {
        componentId: "kpi-card",
        x: 0,
        y: 0,
        width: 3,
        height: 2,
        config: { metric: "active_workflows", label: "Active Workflows" },
      },
      {
        componentId: "kpi-card",
        x: 3,
        y: 0,
        width: 3,
        height: 2,
        config: { metric: "executions_today", label: "Executions Today" },
      },
      {
        componentId: "line-chart",
        x: 0,
        y: 2,
        width: 6,
        height: 4,
        config: { metric: "executions_over_time" },
      },
    ],
  },
  {
    id: "analytics-dashboard",
    name: "Analytics Dashboard",
    description: "Execution outcomes and top workflows by volume.",
    category: "analytics",
    components: [
      {
        componentId: "pie-chart",
        x: 0,
        y: 0,
        width: 4,
        height: 4,
        config: { metric: "workflow_status_breakdown" },
      },
      {
        componentId: "data-table",
        x: 4,
        y: 0,
        width: 4,
        height: 4,
        config: { metric: "top_workflows" },
      },
    ],
  },
  {
    id: "executive-summary",
    name: "Executive Summary",
    description: "High-level KPIs for leadership reporting.",
    category: "executive",
    components: [
      {
        componentId: "kpi-card",
        x: 0,
        y: 0,
        width: 3,
        height: 2,
        config: { metric: "total_executions", label: "Total Executions" },
      },
      {
        componentId: "kpi-card",
        x: 3,
        y: 0,
        width: 3,
        height: 2,
        config: { metric: "success_rate", label: "Success Rate" },
      },
    ],
  },
];
