export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "metrics" | "charts" | "tables" | "forms" | "content" | "ai";
  defaultConfig: Record<string, unknown>;
  configSchema: Record<string, unknown>;
  minWidth: number;
  minHeight: number;
  defaultWidth: number;
  defaultHeight: number;
}

export const WIDGET_CATALOG: WidgetDefinition[] = [
  {
    id: "kpi-card",
    name: "KPI Card",
    description: "Single metric with trend, delta, and status indicator",
    icon: "BarChart3",
    category: "metrics",
    minWidth: 2,
    minHeight: 2,
    defaultWidth: 3,
    defaultHeight: 2,
    defaultConfig: {
      title: "",
      metric: "",
      aggregation: "sum",
      period: "today",
      showTrend: true,
    },
    configSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        metric: { type: "string" },
        aggregation: {
          type: "string",
          enum: ["sum", "avg", "count", "min", "max"],
        },
        period: {
          type: "string",
          enum: ["today", "yesterday", "this_week", "this_month", "all"],
        },
        showTrend: { type: "boolean" },
      },
    },
  },
  {
    id: "time-series-chart",
    name: "Time Series Chart",
    description: "Line or bar chart showing data over time",
    icon: "LineChart",
    category: "charts",
    minWidth: 4,
    minHeight: 3,
    defaultWidth: 6,
    defaultHeight: 4,
    defaultConfig: {
      title: "",
      chartType: "line",
      xField: "date",
      yField: "value",
      timeRange: "7d",
      showLegend: true,
    },
    configSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        chartType: { type: "string", enum: ["line", "bar", "area"] },
        xField: { type: "string" },
        yField: { type: "string" },
        timeRange: { type: "string", enum: ["24h", "7d", "30d", "90d"] },
        showLegend: { type: "boolean" },
      },
    },
  },
  {
    id: "data-table",
    name: "Data Table",
    description: "Sortable and filterable data table with pagination",
    icon: "Table",
    category: "tables",
    minWidth: 4,
    minHeight: 3,
    defaultWidth: 6,
    defaultHeight: 5,
    defaultConfig: {
      title: "",
      columns: [],
      pageSize: 25,
      sortable: true,
      exportable: true,
    },
    configSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        columns: { type: "array", items: { type: "object" } },
        pageSize: { type: "number" },
        sortable: { type: "boolean" },
        exportable: { type: "boolean" },
      },
    },
  },
  {
    id: "kanban-board",
    name: "Kanban Board",
    description: "State-grouped cards with drag-and-drop support",
    icon: "Columns3",
    category: "tables",
    minWidth: 6,
    minHeight: 4,
    defaultWidth: 8,
    defaultHeight: 6,
    defaultConfig: {
      title: "",
      states: ["To Do", "In Progress", "Done"],
      dataSource: "",
    },
    configSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        states: { type: "array", items: { type: "string" } },
        dataSource: { type: "string" },
      },
    },
  },
  {
    id: "form-panel",
    name: "Form Panel",
    description: "Schema-driven input form with validation",
    icon: "FileInput",
    category: "forms",
    minWidth: 3,
    minHeight: 3,
    defaultWidth: 4,
    defaultHeight: 4,
    defaultConfig: {
      title: "",
      fields: [],
      submitAction: "",
      resetAfterSubmit: true,
    },
    configSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        fields: { type: "array", items: { type: "object" } },
        submitAction: { type: "string" },
        resetAfterSubmit: { type: "boolean" },
      },
    },
  },
  {
    id: "ai-insight-card",
    name: "AI Insight Card",
    description:
      "AI-generated summary, explanation, or next action recommendation",
    icon: "Sparkles",
    category: "ai",
    minWidth: 3,
    minHeight: 2,
    defaultWidth: 4,
    defaultHeight: 3,
    defaultConfig: {
      title: "",
      prompt: "",
      model: "gpt-4o-mini",
      refreshInterval: 0,
    },
    configSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        prompt: { type: "string" },
        model: { type: "string" },
        refreshInterval: { type: "number" },
      },
    },
  },
  {
    id: "audit-feed",
    name: "Audit Feed",
    description: "Recent platform or workflow events in a scrolling feed",
    icon: "ScrollText",
    category: "content",
    minWidth: 3,
    minHeight: 2,
    defaultWidth: 4,
    defaultHeight: 3,
    defaultConfig: {
      title: "",
      maxItems: 20,
      showOnlyErrors: false,
      filters: [],
    },
    configSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        maxItems: { type: "number" },
        showOnlyErrors: { type: "boolean" },
        filters: { type: "array", items: { type: "string" } },
      },
    },
  },
  {
    id: "task-queue",
    name: "Task Queue",
    description: "Pending assignments and actions requiring user attention",
    icon: "ListChecks",
    category: "content",
    minWidth: 3,
    minHeight: 2,
    defaultWidth: 4,
    defaultHeight: 3,
    defaultConfig: { title: "", queueType: "approvals", maxItems: 10 },
    configSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        queueType: { type: "string", enum: ["approvals", "tasks", "alerts"] },
        maxItems: { type: "number" },
      },
    },
  },
];

export function getWidgetById(id: string): WidgetDefinition | undefined {
  return WIDGET_CATALOG.find((w) => w.id === id);
}

export function getWidgetsByCategory(
  category: WidgetDefinition["category"],
): WidgetDefinition[] {
  return WIDGET_CATALOG.filter((w) => w.category === category);
}
