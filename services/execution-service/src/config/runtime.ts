/**
 * Execution Service — Runtime configuration.
 *
 * Implements the env-var contract from architecture.md §9.5 and the workflow
 * engine constraints from §9.1–§9.8. These constants are read once at module
 * load and exported as a frozen object so that they cannot be mutated at
 * runtime (defense-in-depth for tenant isolation).
 *
 * All values have architecture-mandated defaults that match the spec exactly;
 * operators may override via env vars for staging experiments but production
 * deployments MUST use the defaults.
 */

export const runtimeConfig = Object.freeze({
  // ─── Worker lease (§9.3, §9.8) ─────────────────────────────────────────────
  // 5-minute lease, renewed every 60s. If a worker dies, the lease expires
  // after 5 minutes and the scheduler requeues the execution with a 'recover'
  // marker. A new worker loads the latest checkpoint and resumes (if idempotent)
  // or restarts the node (if non-idempotent or incomplete).
  WORKER_LEASE_TTL_SECONDS: Number(process.env.WORKER_LEASE_TTL_SECONDS ?? 300),
  LEASE_RENEWAL_INTERVAL_SECONDS: Number(
    process.env.LEASE_RENEWAL_INTERVAL_SECONDS ?? 60,
  ),

  // ─── Recovery (§9.8) ───────────────────────────────────────────────────────
  // A run that fails to recover after 3 attempts is moved to the DLQ with
  // `recovery_exhausted` status.
  MAX_RECOVERY_ATTEMPTS: Number(process.env.MAX_RECOVERY_ATTEMPTS ?? 3),

  // ─── Workflow limits (§9.1, §9.2) ──────────────────────────────────────────
  // Long-running workflows: checkpoint-and-resume with lease renewal. Maximum
  // total workflow duration is 30 days; workflows that exceed this are
  // forcibly terminated and moved to DLQ.
  MAX_WORKFLOW_DURATION_DAYS: Number(
    process.env.MAX_WORKFLOW_DURATION_DAYS ?? 30,
  ),

  // Child workflows: max nesting depth 5. A workflow that tries to spawn a
  // child at depth 6 is rejected at validation time.
  MAX_CHILD_WORKFLOW_DEPTH: Number(process.env.MAX_CHILD_WORKFLOW_DEPTH ?? 5),

  // Loop nodes: statically expanded at runtime. Default 100 iterations, hard
  // cap 10K on Pro, configurable on Enterprise. Unbounded loops are forbidden.
  MAX_LOOP_ITERATIONS_DEFAULT: Number(
    process.env.MAX_LOOP_ITERATIONS_DEFAULT ?? 100,
  ),
  MAX_LOOP_ITERATIONS_PRO: Number(
    process.env.MAX_LOOP_ITERATIONS_PRO ?? 10_000,
  ),

  // ─── Webhook triggers (§17.2, §26.7) ───────────────────────────────────────
  // HMAC-SHA256 signature verification. Reject timestamps > 5min skew to
  // prevent replay attacks.
  WEBHOOK_SIGNATURE_HEADER:
    process.env.WEBHOOK_SIGNATURE_HEADER ?? "x-webhook-signature",
  WEBHOOK_TIMESTAMP_HEADER:
    process.env.WEBHOOK_TIMESTAMP_HEADER ?? "x-webhook-timestamp",
  WEBHOOK_TIMESTAMP_SKEW_SECONDS: Number(
    process.env.WEBHOOK_TIMESTAMP_SKEW_SECONDS ?? 300, // 5 minutes
  ),

  // ─── BullMQ worker concurrency (§9.3) ─────────────────────────────────────
  BULLMQ_CONCURRENCY: Number(process.env.BULLMQ_CONCURRENCY ?? 8),

  // ─── Saga compensation (§9.4) ──────────────────────────────────────────────
  // Best-effort compensation handler timeout. If a compensation handler does
  // not complete within this window, it is logged as `compensation_status =
  // failed` and the next compensation in the reverse-order chain is invoked.
  SAGA_COMPENSATION_TIMEOUT_SECONDS: Number(
    process.env.SAGA_COMPENSATION_TIMEOUT_SECONDS ?? 30,
  ),

  // ─── AI streaming (ADR-008, §8.5) ──────────────────────────────────────────
  // AI partial responses are persisted every ~1 second. TTFT target < 500ms.
  AI_PARTIAL_PERSIST_INTERVAL_MS: Number(
    process.env.AI_PARTIAL_PERSIST_INTERVAL_MS ?? 1000,
  ),
  AI_STREAMING_TTFT_TARGET_MS: Number(
    process.env.AI_STREAMING_TTFT_TARGET_MS ?? 500,
  ),

  // ─── Token budget enforcement (§16.4) ──────────────────────────────────────
  // Per-workflow AI token ceiling. Default 100K tokens per AI run.
  WORKFLOW_TOKEN_CEILING_DEFAULT: Number(
    process.env.WORKFLOW_TOKEN_CEILING_DEFAULT ?? 100_000,
  ),
} as const);

export type RuntimeConfig = typeof runtimeConfig;

/**
 * Validate the runtime config at startup. Called from the service entrypoint.
 * Throws if any value is out of the architecture-mandated range.
 */
export function validateRuntimeConfig(): void {
  const c = runtimeConfig;
  const errors: string[] = [];

  if (c.WORKER_LEASE_TTL_SECONDS < 60 || c.WORKER_LEASE_TTL_SECONDS > 3600) {
    errors.push(
      `WORKER_LEASE_TTL_SECONDS must be between 60 and 3600 (got ${c.WORKER_LEASE_TTL_SECONDS})`,
    );
  }
  if (
    c.LEASE_RENEWAL_INTERVAL_SECONDS < 10 ||
    c.LEASE_RENEWAL_INTERVAL_SECONDS > c.WORKER_LEASE_TTL_SECONDS / 2
  ) {
    errors.push(
      `LEASE_RENEWAL_INTERVAL_SECONDS must be between 10 and WORKER_LEASE_TTL_SECONDS/2 (got ${c.LEASE_RENEWAL_INTERVAL_SECONDS})`,
    );
  }
  if (c.MAX_RECOVERY_ATTEMPTS < 1 || c.MAX_RECOVERY_ATTEMPTS > 10) {
    errors.push(
      `MAX_RECOVERY_ATTEMPTS must be between 1 and 10 (got ${c.MAX_RECOVERY_ATTEMPTS})`,
    );
  }
  if (c.MAX_WORKFLOW_DURATION_DAYS < 1 || c.MAX_WORKFLOW_DURATION_DAYS > 365) {
    errors.push(
      `MAX_WORKFLOW_DURATION_DAYS must be between 1 and 365 (got ${c.MAX_WORKFLOW_DURATION_DAYS})`,
    );
  }
  if (c.MAX_CHILD_WORKFLOW_DEPTH < 1 || c.MAX_CHILD_WORKFLOW_DEPTH > 10) {
    errors.push(
      `MAX_CHILD_WORKFLOW_DEPTH must be between 1 and 10 (got ${c.MAX_CHILD_WORKFLOW_DEPTH}); architecture default is 5`,
    );
  }
  if (
    c.MAX_LOOP_ITERATIONS_DEFAULT < 1 ||
    c.MAX_LOOP_ITERATIONS_DEFAULT > c.MAX_LOOP_ITERATIONS_PRO
  ) {
    errors.push(
      `MAX_LOOP_ITERATIONS_DEFAULT must be between 1 and MAX_LOOP_ITERATIONS_PRO (got ${c.MAX_LOOP_ITERATIONS_DEFAULT})`,
    );
  }
  if (
    c.WEBHOOK_TIMESTAMP_SKEW_SECONDS < 60 ||
    c.WEBHOOK_TIMESTAMP_SKEW_SECONDS > 900
  ) {
    errors.push(
      `WEBHOOK_TIMESTAMP_SKEW_SECONDS must be between 60 and 900 (got ${c.WEBHOOK_TIMESTAMP_SKEW_SECONDS}); architecture default is 300`,
    );
  }

  if (errors.length > 0) {
    throw new Error(
      `Invalid runtime configuration:\n  - ${errors.join("\n  - ")}`,
    );
  }
}
