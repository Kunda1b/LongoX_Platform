import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("notification-service");

// Counters
export const notificationsSentCounter = meter.createCounter("notifications.sent", {
  description: "Total notifications sent",
});

export const notificationsFailedCounter = meter.createCounter("notifications.failed", {
  description: "Total failed notifications",
});

// Histograms
export const notificationDurationHistogram = meter.createHistogram("notifications.duration", {
  description: "Notification processing duration in milliseconds",
  unit: "ms",
});

// Gauges
export const pendingNotificationsGauge = meter.createGauge("notifications.pending", {
  description: "Number of pending notifications",
});

// Helper functions
export function recordNotificationSent(
  channel: string,
  type: string,
  durationMs: number
): void {
  const attrs = { channel, type };
  notificationsSentCounter.add(1, attrs);
  notificationDurationHistogram.record(durationMs, attrs);
}

export function recordNotificationFailed(
  channel: string,
  errorType: string
): void {
  notificationsFailedCounter.add(1, { channel, error_type: errorType });
}

export function updatePendingNotifications(count: number): void {
  pendingNotificationsGauge.record(count);
}
