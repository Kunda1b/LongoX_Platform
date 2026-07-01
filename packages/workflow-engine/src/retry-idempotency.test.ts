import { describe, it, expect } from "vitest";
import {
  computeBackoffDelay,
  DEFAULT_RETRY_POLICY,
  TRIGGER_RETRY_POLICY,
} from "./types";
import type { RetryPolicy } from "./types";

describe("computeBackoffDelay", () => {
  it("returns initialDelayMs for attempt 1", () => {
    const delay = computeBackoffDelay(DEFAULT_RETRY_POLICY, 1);
    expect(delay).toBeGreaterThanOrEqual(500);
    expect(delay).toBeLessThanOrEqual(600);
  });

  it("increases exponentially with each attempt", () => {
    const delay1 = computeBackoffDelay({ ...DEFAULT_RETRY_POLICY, jitter: 0 }, 1);
    const delay2 = computeBackoffDelay({ ...DEFAULT_RETRY_POLICY, jitter: 0 }, 2);
    const delay3 = computeBackoffDelay({ ...DEFAULT_RETRY_POLICY, jitter: 0 }, 3);
    expect(delay2).toBeGreaterThanOrEqual(delay1 * 2);
    expect(delay3).toBeGreaterThanOrEqual(delay2 * 2);
  });

  it("caps at maxDelayMs", () => {
    const policy: RetryPolicy = {
      maxAttempts: 10,
      initialDelayMs: 10_000,
      backoffFactor: 10,
      maxDelayMs: 30_000,
      jitter: 0,
    };
    const delay = computeBackoffDelay(policy, 5);
    expect(delay).toBeLessThanOrEqual(30_000);
  });

  it("applies jitter within expected range", () => {
    const delays = Array.from({ length: 50 }, () =>
      computeBackoffDelay(DEFAULT_RETRY_POLICY, 2)
    );
    const base = 500 * Math.pow(2, 1);
    const minExpected = base;
    const maxExpected = base + base * 0.2;
    for (const d of delays) {
      expect(d).toBeGreaterThanOrEqual(minExpected);
      expect(d).toBeLessThanOrEqual(maxExpected);
    }
  });

  it("returns 0 for TRIGGER_RETRY_POLICY", () => {
    const delay = computeBackoffDelay(TRIGGER_RETRY_POLICY, 1);
    expect(delay).toBe(0);
  });

  it("handles edge case of zero initialDelayMs", () => {
    const policy: RetryPolicy = {
      maxAttempts: 3,
      initialDelayMs: 0,
      backoffFactor: 2,
      maxDelayMs: 10_000,
      jitter: 0,
    };
    expect(computeBackoffDelay(policy, 1)).toBe(0);
    expect(computeBackoffDelay(policy, 2)).toBe(0);
  });
});

describe("DEFAULT_RETRY_POLICY", () => {
  it("has correct defaults", () => {
    expect(DEFAULT_RETRY_POLICY.maxAttempts).toBe(3);
    expect(DEFAULT_RETRY_POLICY.initialDelayMs).toBe(500);
    expect(DEFAULT_RETRY_POLICY.backoffFactor).toBe(2);
    expect(DEFAULT_RETRY_POLICY.maxDelayMs).toBe(30_000);
    expect(DEFAULT_RETRY_POLICY.jitter).toBe(0.2);
  });
});

describe("TRIGGER_RETRY_POLICY", () => {
  it("has no retry for triggers", () => {
    expect(TRIGGER_RETRY_POLICY.maxAttempts).toBe(1);
    expect(TRIGGER_RETRY_POLICY.initialDelayMs).toBe(0);
    expect(TRIGGER_RETRY_POLICY.backoffFactor).toBe(1);
    expect(TRIGGER_RETRY_POLICY.maxDelayMs).toBe(0);
    expect(TRIGGER_RETRY_POLICY.jitter).toBe(0);
  });
});
