import type { WidgetInstance, RenderContext } from "@longox/dashboard-renderer";
export interface WidgetComponentProps {
  widget: WidgetInstance;
  context: RenderContext;
  data: unknown;
}
export type WidgetComponent = (props: WidgetComponentProps) => string;
export const KpiCardWidget: WidgetComponent = ({ widget, data }) => {
  return `<div class="kpi-card"><h3>${widget.title}</h3><div class="kpi-value">${String(data ?? "�")}</div></div>`;
};
export const TimeSeriesChartWidget: WidgetComponent = ({ widget }) => {
  return `<div class="chart-widget"><h3>${widget.title}</h3><div class="chart-container">[Chart placeholder]</div></div>`;
};
export const DataTableWidget: WidgetComponent = ({ widget, data }) => {
  const rows = Array.isArray(data) ? data : [];
  return `<div class="data-table-widget"><h3>${widget.title}</h3><table>${rows.map(() => "<tr><td>row</td></tr>").join("")}</table></div>`;
};
export const KanbanBoardWidget: WidgetComponent = ({ widget }) => {
  return `<div class="kanban-widget"><h3>${widget.title}</h3><div class="kanban-columns">[Kanban placeholder]</div></div>`;
};
export const FormPanelWidget: WidgetComponent = ({ widget }) => {
  return `<div class="form-widget"><h3>${widget.title}</h3><form>[Form fields]</form></div>`;
};
export const MapWidget: WidgetComponent = ({ widget }) => {
  return `<div class="map-widget"><h3>${widget.title}</h3><div>[Map placeholder]</div></div>`;
};
export const FileWidget: WidgetComponent = ({ widget }) => {
  return `<div class="file-widget"><h3>${widget.title}</h3><div>[File upload]</div></div>`;
};
export const AiInsightCardWidget: WidgetComponent = ({ widget, data }) => {
  return `<div class="ai-insight-card"><h3>${widget.title}</h3><p>${String(data ?? "No insight available")}</p></div>`;
};
export const AuditFeedWidget: WidgetComponent = ({ widget }) => {
  return `<div class="audit-feed"><h3>${widget.title}</h3><ul>[Audit entries]</ul></div>`;
};
export const TaskQueueWidget: WidgetComponent = ({ widget }) => {
  return `<div class="task-queue"><h3>${widget.title}</h3><div>[Task list]</div></div>`;
};
