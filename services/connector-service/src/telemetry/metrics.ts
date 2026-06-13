import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("connector-service");

// Counters
export const connectorInstallsCounter = meter.createCounter("connector.installs", {
  description: "Total connector installations",
});

export const connectorExecutionsCounter = meter.createCounter("connector.executions", {
  description: "Total connector executions",
});

export const connectorErrorsCounter = meter.createCounter("connector.errors", {
  description: "Total connector errors",
});

// Histograms
export const connectorExecutionDurationHistogram = meter.createHistogram("connector.execution.duration", {
  description: "Connector execution duration in milliseconds",
  unit: "ms",
});

// Gauges
export const activeConnectorInstallsGauge = meter.createGauge("connector.installs.active", {
  description: "Number of active connector installations",
});

// Helper functions
export function recordConnectorInstall(
  connectorId: string,
  tenantId: string
): void {
  connectorInstallsCounter.add(1, { connector_id: connectorId, tenant_id: tenantId });
}

export function recordConnectorExecution(
  connectorId: string,
  action: string,
  durationMs: number,
  success: boolean
): void {
  const attrs = { connector_id: connectorId, action, success: success.toString() };
  connectorExecutionsCounter.add(1, attrs);
  connectorExecutionDurationHistogram.record(durationMs, attrs);
}

export function recordConnectorError(
  connectorId: string,
  errorType: string
): void {
  connectorErrorsCounter.add(1, { connector_id: connectorId, error_type: errorType });
}

export function updateActiveConnectorInstalls(count: number): void {
  activeConnectorInstallsGauge.record(count);
}
