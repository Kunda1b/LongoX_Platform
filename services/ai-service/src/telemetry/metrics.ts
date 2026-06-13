import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("ai-service");

// Counters
export const aiRequestsCounter = meter.createCounter("ai.requests", {
  description: "Total AI requests",
});

export const aiRequestsFailedCounter = meter.createCounter("ai.requests.failed", {
  description: "Total failed AI requests",
});

export const aiTokensCounter = meter.createCounter("ai.tokens", {
  description: "Total AI tokens consumed",
});

// Histograms
export const aiRequestDurationHistogram = meter.createHistogram("ai.request.duration", {
  description: "AI request duration in seconds",
  unit: "s",
});

export const aiTokensPerRequestHistogram = meter.createHistogram("ai.tokens.per_request", {
  description: "Tokens per AI request",
  unit: "1",
});

// Helper functions
export function recordAiRequest(
  provider: string,
  model: string,
  durationMs: number,
  inputTokens: number,
  outputTokens: number,
): void {
  const attrs = { provider, model };

  aiRequestsCounter.add(1, attrs);
  aiRequestDurationHistogram.record(durationMs / 1000, attrs);
  aiTokensCounter.add(inputTokens, { ...attrs, token_type: "prompt" });
  aiTokensCounter.add(outputTokens, { ...attrs, token_type: "completion" });
  aiTokensPerRequestHistogram.record(inputTokens + outputTokens, attrs);
}

export function recordAiRequestFailed(
  provider: string,
  errorType: string,
): void {
  aiRequestsFailedCounter.add(1, { provider, error_type: errorType });
}
