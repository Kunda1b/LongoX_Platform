/**
 * @longox/shared-testing — test fixtures & mock helpers.
 *
 * Provides lightweight, deterministic builders for the most common domain
 * entities used in unit/integration tests. Builders return fresh mutable
 * copies so tests can freely mutate without leaking state across cases.
 *
 * (matrix item 45 — eliminate placeholder; expose real helpers.)
 */

import { randomUUID } from "node:crypto";

// ─── Tenant / user fixtures ───────────────────────────────────────────────────

export interface TenantFixture {
  id: string;
  name: string;
  slug: string;
  status: string;
  planId: string;
  tier: number;
  primaryRegion: string | null;
}

export function makeTenant(
  overrides: Partial<TenantFixture> = {},
): TenantFixture {
  const id = overrides.id ?? `tnt_test_${randomUUID().slice(0, 12)}`;
  return {
    id,
    name: overrides.name ?? "Test Tenant",
    slug: overrides.slug ?? `test-tenant-${id.slice(-8)}`,
    status: overrides.status ?? "active",
    planId: overrides.planId ?? "plan_free",
    tier: overrides.tier ?? 1,
    primaryRegion: overrides.primaryRegion ?? "us-east-1",
  };
}

export interface UserFixture {
  id: string;
  tenantId: string;
  email: string;
  role: string;
  status: string;
}

export function makeUser(overrides: Partial<UserFixture> = {}): UserFixture {
  const tenantId =
    overrides.tenantId ?? `tnt_test_${randomUUID().slice(0, 12)}`;
  return {
    id: overrides.id ?? `usr_test_${randomUUID().slice(0, 12)}`,
    tenantId,
    email: overrides.email ?? `user+${randomUUID().slice(0, 8)}@example.test`,
    role: overrides.role ?? "member",
    status: overrides.status ?? "active",
  };
}

// ─── Workflow / execution fixtures ────────────────────────────────────────────

export interface WorkflowFixture {
  id: string;
  tenantId: string;
  name: string;
  status: string;
  triggerType: string;
}

export function makeWorkflow(
  overrides: Partial<WorkflowFixture> = {},
): WorkflowFixture {
  const tenantId =
    overrides.tenantId ?? `tnt_test_${randomUUID().slice(0, 12)}`;
  return {
    id: overrides.id ?? `wf_test_${randomUUID().slice(0, 12)}`,
    tenantId,
    name: overrides.name ?? "Test Workflow",
    status: overrides.status ?? "draft",
    triggerType: overrides.triggerType ?? "manual",
  };
}

export interface ExecutionFixture {
  id: string;
  workflowId: string;
  tenantId: string;
  status: string;
  startedAt: Date;
}

export function makeExecution(
  overrides: Partial<ExecutionFixture> = {},
): ExecutionFixture {
  const tenantId =
    overrides.tenantId ?? `tnt_test_${randomUUID().slice(0, 12)}`;
  const workflowId =
    overrides.workflowId ?? `wf_test_${randomUUID().slice(0, 12)}`;
  return {
    id: overrides.id ?? `exe_test_${randomUUID().slice(0, 12)}`,
    workflowId,
    tenantId,
    status: overrides.status ?? "running",
    startedAt: overrides.startedAt ?? new Date("2024-01-01T00:00:00.000Z"),
  };
}

// ─── Mock helpers ─────────────────────────────────────────────────────────────

/**
 * Build a no-op mock for a Jest/ViTest fn. Returns the same shape as
 * `vi.fn()` / `jest.fn()` so tests can assert on `.mock.calls`.
 *
 * The returned mock resolves to `undefined` by default; pass `returnValue`
 * to override. Pass `throwError` to make the mock reject.
 */
export type AnyFn = (...args: any[]) => any;

export interface MockOptions<T> {
  returnValue?: T;
  throwError?: Error | string;
}

export function makeMock<T = unknown>(opts: MockOptions<T> = {}) {
  const calls: any[][] = [];
  const mock = (...args: any[]) => {
    calls.push(args);
    if (opts.throwError) {
      const err =
        typeof opts.throwError === "string"
          ? new Error(opts.throwError)
          : opts.throwError;
      return Promise.reject(err);
    }
    return opts.returnValue;
  };
  (mock as any).mock = { calls };
  return mock as ((...args: any[]) => any) & { mock: { calls: any[][] } };
}

/**
 * Returns a deferred promise + its resolve/reject pair. Useful for testing
 * async code that depends on an externally-controlled completion signal.
 */
export function deferred<T = void>(): {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
} {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/**
 * Wait `ms` milliseconds. Use in tests that need to advance the event loop
 * without coupling to fake timers.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
