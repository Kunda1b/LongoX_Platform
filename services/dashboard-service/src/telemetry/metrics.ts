import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("dashboard-service");

// Counters
export const dashboardViewsCounter = meter.createCounter("dashboard.views", {
  description: "Total dashboard views",
});

export const dashboardUpdatesCounter = meter.createCounter(
  "dashboard.updates",
  {
    description: "Total dashboard updates",
  },
);

export const dashboardPublishesCounter = meter.createCounter(
  "dashboard.publishes",
  {
    description: "Total dashboard publishes",
  },
);

// Histograms
export const dashboardLoadDurationHistogram = meter.createHistogram(
  "dashboard.load.duration",
  {
    description: "Dashboard load duration in milliseconds",
    unit: "ms",
  },
);

// Gauges
export const activeDashboardsGauge = meter.createGauge("dashboards.active", {
  description: "Number of active dashboards",
});

// Helper functions
export function recordDashboardView(
  dashboardId: string,
  tenantId: string,
  durationMs: number,
): void {
  const attrs = { dashboard_id: dashboardId, tenant_id: tenantId };
  dashboardViewsCounter.add(1, attrs);
  dashboardLoadDurationHistogram.record(durationMs, attrs);
}

export function recordDashboardUpdate(
  dashboardId: string,
  tenantId: string,
): void {
  dashboardUpdatesCounter.add(1, {
    dashboard_id: dashboardId,
    tenant_id: tenantId,
  });
}

export function recordDashboardPublish(
  dashboardId: string,
  tenantId: string,
): void {
  dashboardPublishesCounter.add(1, {
    dashboard_id: dashboardId,
    tenant_id: tenantId,
  });
}

export function updateActiveDashboards(count: number): void {
  activeDashboardsGauge.record(count);
}
