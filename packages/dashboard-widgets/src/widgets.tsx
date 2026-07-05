import type { WidgetInstance, RenderContext } from "@longox/dashboard-renderer";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface WidgetComponentProps {
  widget: WidgetInstance;
  context: RenderContext;
  data: unknown;
}

export type WidgetComponent = (props: WidgetComponentProps) => React.ReactNode;

function formatValue(val: unknown): string {
  if (typeof val === "number") return val.toLocaleString();
  return String(val ?? "—");
}

const CHART_COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#a855f7",
  "#ec4899",
];

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isRecordArray(v: unknown): v is Record<string, unknown>[] {
  return Array.isArray(v) && v.every(isRecord);
}

function extractKey(
  rows: Record<string, unknown>[],
  preferredKey?: string,
): string {
  if (preferredKey && preferredKey in rows[0]) return preferredKey;
  return Object.keys(rows[0])[0] || "value";
}

export function KpiCardWidget({ widget, data }: WidgetComponentProps) {
  const config = widget.config as Record<string, string>;
  const label = config.label ?? "Value";
  const trend = config.trend;
  const val = isRecord(data) ? (data.value ?? data) : data;
  const displayVal = formatValue(val);

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight">{displayVal}</p>
      {trend && (
        <div className="mt-1 flex items-center gap-1 text-sm">
          {trend === "up" && <TrendingUp className="h-4 w-4 text-green-500" />}
          {trend === "down" && (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
          {trend === "flat" && (
            <Minus className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-muted-foreground">
            {config.trendLabel ?? ""}
          </span>
        </div>
      )}
    </div>
  );
}

export function TimeSeriesChartWidget({ widget, data }: WidgetComponentProps) {
  const config = widget.config as Record<string, string>;
  const rows = isRecordArray(data) ? data : [];
  if (rows.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground rounded-lg border bg-card">
        No data
      </div>
    );
  }
  const key = extractKey(rows, config.xKey);
  const valKey =
    config.yKey ??
    (Object.keys(rows[0]).find(
      (k) => k !== key && typeof rows[0][k] === "number",
    ) ||
      "value");

  return (
    <div className="rounded-lg border bg-card p-4">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey={key}
            tick={{ fontSize: 12 }}
            stroke="hsl(var(--muted-foreground))"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="hsl(var(--muted-foreground))"
          />
          <Tooltip />
          <Line
            type="monotone"
            dataKey={valKey}
            stroke="#6366f1"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DataTableWidget({ widget, data }: WidgetComponentProps) {
  const rows = isRecordArray(data) ? data : [];
  if (rows.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground rounded-lg border bg-card">
        No data
      </div>
    );
  }
  const columns = Object.keys(rows[0]);

  return (
    <div className="overflow-auto rounded-lg border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            {columns.map((col) => (
              <th
                key={col}
                className="px-3 py-2 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
              {columns.map((col) => (
                <td key={col} className="px-3 py-2">
                  {formatValue(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function KanbanBoardWidget({ widget, data }: WidgetComponentProps) {
  const config = widget.config as Record<string, string>;
  const items = isRecordArray(data) ? data : [];
  const groupBy = config.groupBy ?? "status";
  const groups = new Map<string, Record<string, unknown>[]>();
  for (const item of items) {
    const key = String(item[groupBy] ?? "Uncategorized");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }

  return (
    <div className="flex gap-3 overflow-x-auto rounded-lg border bg-card p-3">
      {Array.from(groups.entries()).map(([group, groupItems]) => (
        <div key={group} className="min-w-48 flex-1">
          <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
            {group} ({groupItems.length})
          </h4>
          <div className="space-y-2">
            {groupItems.map((item, i) => {
              const title = config.titleKey
                ? String(item[config.titleKey] ?? "")
                : String(item.id ?? i);
              return (
                <div
                  key={i}
                  className="rounded-md border bg-background p-2 text-sm shadow-sm"
                >
                  {title}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function FormPanelWidget({ widget }: WidgetComponentProps) {
  return (
    <div className="flex h-32 items-center justify-center rounded-lg border border-dashed bg-card text-sm text-muted-foreground">
      Form: {widget.title}
    </div>
  );
}

export function MapWidget({ widget }: WidgetComponentProps) {
  return (
    <div className="flex h-48 items-center justify-center rounded-lg border bg-card text-sm text-muted-foreground">
      <div className="text-center">
        <p className="font-medium">Map</p>
        <p className="text-xs">{widget.title}</p>
      </div>
    </div>
  );
}

export function FileWidget({ widget }: WidgetComponentProps) {
  return (
    <div className="flex h-32 items-center justify-center rounded-lg border border-dashed bg-card text-sm text-muted-foreground">
      File: {widget.title}
    </div>
  );
}

export function AiInsightCardWidget({ widget, data }: WidgetComponentProps) {
  const insight =
    typeof data === "string"
      ? data
      : isRecord(data)
        ? String(data.insight ?? data.text ?? "")
        : "No insight available";
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground mb-1">{widget.title}</p>
      <p className="text-sm">{insight}</p>
    </div>
  );
}

export function AuditFeedWidget({ widget, data }: WidgetComponentProps) {
  const entries = isRecordArray(data) ? data : [];
  return (
    <div className="space-y-2 rounded-lg border bg-card p-4">
      <h4 className="text-sm font-medium">{widget.title}</h4>
      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground">No entries</p>
      ) : (
        entries.slice(0, 10).map((entry, i) => (
          <div
            key={i}
            className="flex items-center justify-between border-b pb-1 last:border-0 text-xs"
          >
            <span>{String(entry.action ?? entry.type ?? "—")}</span>
            <span className="text-muted-foreground">
              {String(entry.timestamp ?? entry.createdAt ?? "")}
            </span>
          </div>
        ))
      )}
    </div>
  );
}

export function TaskQueueWidget({ widget, data }: WidgetComponentProps) {
  const tasks = isRecordArray(data) ? data : [];
  return (
    <div className="rounded-lg border bg-card p-4">
      <h4 className="text-sm font-medium mb-2">{widget.title}</h4>
      {tasks.length === 0 ? (
        <p className="text-xs text-muted-foreground">No tasks</p>
      ) : (
        <div className="space-y-1">
          {tasks.map((task, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-xs"
            >
              <span className="flex-1">
                {String(task.name ?? task.title ?? `Task ${i + 1}`)}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  task.status === "done"
                    ? "bg-green-100 text-green-700"
                    : task.status === "in_progress"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-600"
                }`}
              >
                {String(task.status ?? "pending")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const widgetRegistry: Record<string, WidgetComponent> = {
  "kpi-card": KpiCardWidget,
  "time-series-chart": TimeSeriesChartWidget,
  "data-table": DataTableWidget,
  "kanban-board": KanbanBoardWidget,
  "form-panel": FormPanelWidget,
  "map-widget": MapWidget,
  "file-widget": FileWidget,
  "ai-insight-card": AiInsightCardWidget,
  "audit-feed": AuditFeedWidget,
  "task-queue": TaskQueueWidget,
};

export function renderWidget(
  widget: WidgetInstance,
  context: RenderContext,
): React.ReactNode {
  const Component = widgetRegistry[widget.type];
  if (!Component) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border bg-muted text-sm text-muted-foreground">
        Unknown widget type: {widget.type}
      </div>
    );
  }
  const data = context.data[widget.id] ?? null;
  return <Component widget={widget} context={context} data={data} />;
}
