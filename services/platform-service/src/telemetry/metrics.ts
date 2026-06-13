import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("platform-service");

// Counters
export const platformEventsCounter = meter.createCounter("platform.events", {
  description: "Total platform events",
});

export const featureFlagEvaluationsCounter = meter.createCounter("platform.feature_flags.evaluations", {
  description: "Total feature flag evaluations",
});

// Histograms
export const platformOperationDurationHistogram = meter.createHistogram("platform.operation.duration", {
  description: "Platform operation duration in milliseconds",
  unit: "ms",
});

// Gauges
export const activeTenantsGauge = meter.createGauge("platform.tenants.active", {
  description: "Number of active tenants",
});

// Helper functions
export function recordPlatformEvent(
  eventType: string,
  aggregateType: string
): void {
  platformEventsCounter.add(1, { event_type: eventType, aggregate_type: aggregateType });
}

export function recordFeatureFlagEvaluation(
  flagKey: string,
  enabled: boolean
): void {
  featureFlagEvaluationsCounter.add(1, { flag_key: flagKey, enabled: enabled.toString() });
}

export function updateActiveTenants(count: number): void {
  activeTenantsGauge.record(count);
}
