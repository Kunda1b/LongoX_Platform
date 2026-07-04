/**
 * Shared queue topology & job types.
 *
 * Implements ADR-001 / architecture.md §11 — 10 named BullMQ queues with
 * per-queue Redis AOF persistence settings. Each queue maps to a specific
 * operational concern; jobs are never mixed across queues (except the
 * legacy `longox:executions` shim which is preserved for backwards
 * compatibility with code that hasn't been migrated to the named queues).
 */

// ─── Named queues (ADR-001 / §11) ─────────────────────────────────────────────

/**
 * Canonical BullMQ queue names. Each queue has its own Redis connection
 * settings (AOF mode, db index, limiter) defined in `QUEUE_TOPOLOGY` below.
 *
 * AOF persistence mapping:
 *   - "every-write"     → Redis AOF fsync on every write (safest, slowest)
 *   - "every-second"    → Redis AOF fsync every second (balanced)
 *   - "rdb-only"        → RDB snapshot only (fastest, slight data-loss risk)
 */
export type QueueName =
  | "workflow-execution"
  | "workflow-execution-recovery"
  | "webhook-delivery"
  | "ai-run"
  | "billing-rollup"
  | "billing-reconciliation"
  | "notification-outbound"
  | "connector-install"
  | "template-publish"
  | "audit-export";

/** Redis AOF persistence mode for a queue (ADR-001 / §11). */
export type AofMode = "every-write" | "every-second" | "rdb-only";

/** Job priority levels for queues that support priority (e.g. workflow-execution). */
export type JobPriority = "high" | "default" | "low";

/**
 * Topology config for a single named queue.
 *
 * `redis.db` is the logical Redis database index (0–15). Each queue is
 * isolated on its own DB to prevent key collisions between BullMQ instances
 * and to allow per-queue persistence tuning.
 */
export interface QueueTopologyEntry {
  name: QueueName;
  aof: AofMode;
  /** Redis logical database index (0–15). */
  redisDb: number;
  /** Optional priority levels — only set for queues that use BullMQ priorities. */
  priorities?: JobPriority[];
  /** Optional rate-limiter config. */
  limiter?: { max: number; duration: number };
}

/**
 * The full topology of all 10 named BullMQ queues (ADR-001 / §11).
 *
 * DB index allocation (each queue gets its own Redis DB for isolation):
 *   0 — workflow-execution
 *   1 — workflow-execution-recovery
 *   2 — webhook-delivery
 *   3 — ai-run
 *   4 — billing-rollup
 *   5 — billing-reconciliation
 *   6 — notification-outbound
 *   7 — connector-install
 *   8 — template-publish
 *   9 — audit-export
 */
export const QUEUE_TOPOLOGY: Record<QueueName, QueueTopologyEntry> = {
  "workflow-execution": {
    name: "workflow-execution",
    aof: "every-write",
    redisDb: 0,
    priorities: ["high", "default", "low"],
    limiter: { max: 100, duration: 60_000 },
  },
  "workflow-execution-recovery": {
    name: "workflow-execution-recovery",
    aof: "every-write",
    redisDb: 1,
    limiter: { max: 20, duration: 60_000 },
  },
  "webhook-delivery": {
    name: "webhook-delivery",
    aof: "every-write",
    redisDb: 2,
    limiter: { max: 200, duration: 60_000 },
  },
  "ai-run": {
    name: "ai-run",
    aof: "every-second",
    redisDb: 3,
    limiter: { max: 50, duration: 60_000 },
  },
  "billing-rollup": {
    name: "billing-rollup",
    aof: "every-second",
    redisDb: 4,
    limiter: { max: 10, duration: 60_000 },
  },
  "billing-reconciliation": {
    name: "billing-reconciliation",
    aof: "every-second",
    redisDb: 5,
    limiter: { max: 5, duration: 60_000 },
  },
  "notification-outbound": {
    name: "notification-outbound",
    aof: "every-second",
    redisDb: 6,
    limiter: { max: 100, duration: 60_000 },
  },
  "connector-install": {
    name: "connector-install",
    aof: "every-second",
    redisDb: 7,
    limiter: { max: 5, duration: 60_000 },
  },
  "template-publish": {
    name: "template-publish",
    aof: "rdb-only",
    redisDb: 8,
    limiter: { max: 5, duration: 60_000 },
  },
  "audit-export": {
    name: "audit-export",
    aof: "rdb-only",
    redisDb: 9,
    limiter: { max: 5, duration: 60_000 },
  },
};

/** Ordered list of all 10 queue names — useful for workers that drain all queues. */
export const ALL_QUEUE_NAMES: QueueName[] = Object.keys(QUEUE_TOPOLOGY) as QueueName[];

// ─── Job types & payloads ─────────────────────────────────────────────────────

/**
 * Backwards-compatible `JobType` alias. Maps onto the new `QueueName` union.
 * Existing call sites that pass `"workflow-execution" | "webhook-delivery" | "ai-run"`
 * continue to compile unchanged; new call sites should prefer `QueueName`.
 */
export type JobType = QueueName;

export interface WorkflowJobData {
  executionId: string;
  workflowId: string;
  workflowName: string;
  nodes: unknown[];
  triggerPayload: Record<string, unknown>;
  triggerType: string;
  /** Optional parent execution id for child-workflow orchestration (§9.6). */
  parentExecutionId?: string | null;
}

export interface WebhookJobData {
  workflowId: string;
  payload: Record<string, unknown>;
}

export interface AiRunJobData {
  nodeTypeId: string;
  config: Record<string, unknown>;
  input: Record<string, unknown>;
  workflowId: string;
}

/** Placeholder data shape for queues that don't have a strongly-typed payload yet. */
export interface GenericJobData {
  [key: string]: unknown;
}

export interface BillingRollupJobData extends GenericJobData {
  tenantId?: string;
  periodStart?: string;
  periodEnd?: string;
}

export interface BillingReconciliationJobData extends GenericJobData {
  tenantId?: string;
  rollupId?: string;
}

export interface NotificationOutboundJobData extends GenericJobData {
  notificationId?: string;
  channel?: string;
  recipient?: string;
}

export interface ConnectorInstallJobData extends GenericJobData {
  connectorId?: string;
  tenantId?: string;
  version?: string;
}

export interface TemplatePublishJobData extends GenericJobData {
  templateId?: string;
  version?: string;
}

export interface AuditExportJobData extends GenericJobData {
  exportId?: string;
  tenantId?: string;
  format?: "json" | "csv";
}

export interface WorkflowRecoveryJobData extends GenericJobData {
  executionId?: string;
  workflowId?: string;
  nodes?: unknown[];
  triggerPayload?: Record<string, unknown>;
}

/**
 * Strongly-typed map of queue name → job payload. Queues without a
 * strongly-typed payload fall back to `GenericJobData`.
 */
export type JobDataMap = {
  "workflow-execution": WorkflowJobData;
  "workflow-execution-recovery": WorkflowRecoveryJobData;
  "webhook-delivery": WebhookJobData;
  "ai-run": AiRunJobData;
  "billing-rollup": BillingRollupJobData;
  "billing-reconciliation": BillingReconciliationJobData;
  "notification-outbound": NotificationOutboundJobData;
  "connector-install": ConnectorInstallJobData;
  "template-publish": TemplatePublishJobData;
  "audit-export": AuditExportJobData;
};

export interface RetryPolicy {
  attempts: number;
  backoffType: "exponential" | "fixed";
  backoffDelayMs: number;
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  attempts: 3,
  backoffType: "exponential",
  backoffDelayMs: 1000,
};

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export interface JobQueue {
  addJob<T extends JobType>(
    type: T,
    data: JobDataMap[T],
    maxAttempts?: number,
  ): Promise<void>;
  addDelayedJob<T extends JobType>(
    type: T,
    data: JobDataMap[T],
    delayMs: number,
    maxAttempts?: number,
  ): Promise<void>;
  addScheduledJob<T extends JobType>(
    type: T,
    data: JobDataMap[T],
    cronExpression: string,
    maxAttempts?: number,
  ): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  getStats(): Promise<QueueStats>;
}
