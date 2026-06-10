export type WidgetType =
  | "kpi-card" | "time-series-chart" | "data-table" | "kanban-board"
  | "form-panel" | "map-widget" | "file-widget" | "ai-insight-card"
  | "audit-feed" | "task-queue";
export interface DashboardLayout {
  columns: number;
  rows: number;
  gap: number;
  breakpoints: Record<string, { columns: number; gap: number }>;
}
export interface WidgetInstance {
  id: string;
  type: WidgetType;
  title: string;
  position: { x: number; y: number; w: number; h: number };
  config: Record<string, unknown>;
  dataBinding?: DataBinding;
}
export interface DataBinding {
  source: "api-query" | "workflow-output" | "dataset" | "manual";
  query?: string;
  parameters?: Record<string, unknown>;
  refreshInterval?: number;
}
export interface DashboardDefinition {
  id: string;
  title: string;
  layout: DashboardLayout;
  widgets: WidgetInstance[];
  theme?: Record<string, unknown>;
  permissions?: Record<string, string[]>;
}
export interface DashboardPermissions {
  visibility: "public" | "role-restricted" | "private";
  allowedRoles: string[];
  widgetOverrides: Record<string, { allowedRoles: string[] }>;
}
export interface RenderContext {
  dashboard: DashboardDefinition;
  data: Record<string, unknown>;
  permissions: DashboardPermissions;
  environment: string;
}
export function resolveWidgetData(binding: DataBinding | undefined, context: RenderContext): unknown {
  if (!binding) return null;
  if (binding.source === "manual") return binding.parameters;
  const key = binding.query ?? binding.source;
  return context.data[key] ?? null;
}
export function checkWidgetVisibility(widget: WidgetInstance, permissions: DashboardPermissions): boolean {
  if (permissions.visibility === "public") return true;
  const override = permissions.widgetOverrides[widget.id];
  const allowed = override?.allowedRoles ?? permissions.allowedRoles;
  return allowed.length === 0;
}
export const defaultLayout: DashboardLayout = {
  columns: 12, rows: 0, gap: 16,
  breakpoints: { sm: { columns: 4, gap: 8 }, md: { columns: 8, gap: 12 }, lg: { columns: 12, gap: 16 } },
};
