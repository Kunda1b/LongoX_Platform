import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("billing-service");

// Counters
export const billingEventsCounter = meter.createCounter("billing.events", {
  description: "Total billing events processed",
});

export const billingErrorsCounter = meter.createCounter("billing.errors", {
  description: "Total billing errors",
});

// Histograms
export const billingOperationDurationHistogram = meter.createHistogram(
  "billing.operation.duration",
  {
    description: "Billing operation duration in milliseconds",
    unit: "ms",
  },
);

// Gauges
export const activeSubscriptionsGauge = meter.createGauge(
  "billing.subscriptions.active",
  {
    description: "Number of active subscriptions",
  },
);

// Helper functions
export function recordBillingEvent(
  eventType: string,
  provider: string,
  durationMs: number,
): void {
  const attrs = { event_type: eventType, provider };
  billingEventsCounter.add(1, attrs);
  billingOperationDurationHistogram.record(durationMs, attrs);
}

export function recordBillingError(errorType: string, provider: string): void {
  billingErrorsCounter.add(1, { error_type: errorType, provider });
}

export function updateActiveSubscriptions(count: number): void {
  activeSubscriptionsGauge.record(count);
}
