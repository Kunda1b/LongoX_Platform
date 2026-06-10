export interface RetryPolicy {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30_000,
  backoffMultiplier: 2,
  retryableErrors: [
    "timeout",
    "rate limit",
    "too many requests",
    "service unavailable",
    "internal server error",
    "connection refused",
    "network",
    "ECONNRESET",
    "ETIMEDOUT",
    "5xx",
  ],
};

export function shouldRetry(
  error: string,
  policy: RetryPolicy = DEFAULT_RETRY_POLICY,
): boolean {
  const lower = error.toLowerCase();
  return policy.retryableErrors.some((pattern) =>
    lower.includes(pattern.toLowerCase()),
  );
}

export function getRetryDelay(
  attempt: number,
  policy: RetryPolicy = DEFAULT_RETRY_POLICY,
): number {
  const delay =
    policy.baseDelayMs * Math.pow(policy.backoffMultiplier, attempt - 1);
  return Math.min(delay, policy.maxDelayMs);
}

export function calculateExponentialBackoff(
  attempt: number,
  baseMs: number = 1000,
): number {
  const delay = baseMs * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 0.3 * delay;
  return Math.min(Math.floor(delay + jitter), 30_000);
}
