import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("audit-service");

// Counters
export const auditEventsCounter = meter.createCounter("audit.events", {
  description: "Total audit events recorded",
});

export const auditQueriesCounter = meter.createCounter("audit.queries", {
  description: "Total audit log queries",
});

// Histograms
export const auditQueryDurationHistogram = meter.createHistogram(
  "audit.query.duration",
  {
    description: "Audit query duration in milliseconds",
    unit: "ms",
  },
);

// Gauges
export const auditEventsPerMinuteGauge = meter.createGauge(
  "audit.events.per_minute",
  {
    description: "Audit events per minute",
  },
);

// Helper functions
export function recordAuditEvent(
  action: string,
  resourceType: string,
  actorType: string,
): void {
  auditEventsCounter.add(1, {
    action,
    resource_type: resourceType,
    actor_type: actorType,
  });
}

export function recordAuditQuery(
  durationMs: number,
  resultCount: number,
): void {
  auditQueriesCounter.add(1, { result_count: resultCount.toString() });
  auditQueryDurationHistogram.record(durationMs);
}

export function updateAuditEventsPerMinute(count: number): void {
  auditEventsPerMinuteGauge.record(count);
}
