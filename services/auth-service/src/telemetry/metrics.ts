import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("auth-service");

// Counters
export const authAttemptsCounter = meter.createCounter("auth.attempts", {
  description: "Total authentication attempts",
});

export const authSuccessCounter = meter.createCounter("auth.success", {
  description: "Total successful authentications",
});

export const authFailuresCounter = meter.createCounter("auth.failures", {
  description: "Total failed authentications",
});

// Histograms
export const authDurationHistogram = meter.createHistogram("auth.duration", {
  description: "Authentication duration in milliseconds",
  unit: "ms",
});

// Gauges
export const activeSessionsGauge = meter.createGauge("auth.sessions.active", {
  description: "Number of active sessions",
});

// Helper functions
export function recordAuthAttempt(method: string, provider: string): void {
  authAttemptsCounter.add(1, { method, provider });
}

export function recordAuthSuccess(
  method: string,
  provider: string,
  durationMs: number,
): void {
  const attrs = { method, provider };
  authSuccessCounter.add(1, attrs);
  authDurationHistogram.record(durationMs, attrs);
}

export function recordAuthFailure(
  method: string,
  provider: string,
  errorType: string,
): void {
  authFailuresCounter.add(1, { method, provider, error_type: errorType });
}

export function updateActiveSessions(count: number): void {
  activeSessionsGauge.record(count);
}
