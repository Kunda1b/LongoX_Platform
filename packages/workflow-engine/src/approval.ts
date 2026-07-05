/**
 * Human approval gate utilities.
 *
 * When the DAGRunner encounters a node with `approvalGate` config, it writes
 * an approval task to the database and pauses execution of that branch.
 *
 * External systems (admin UI, email link, Slack bot) call resumeApproval()
 * which updates the approval_tasks row and re-enqueues the execution
 * from the paused checkpoint.
 *
 * The DAGRunner resumes by reloading checkpoints — the paused node will
 * be in the checkpoint store with status "paused". On resume, the approval
 * decision is injected into the execution context and the node's downstream
 * branch is unlocked.
 */

import type { ApprovalDecision, ApprovalResumeSignal } from "./types";

// ─── DB-backed approval store ─────────────────────────────────────────────────

export interface ApprovalStore {
  /**
   * Record a new pending approval task.
   * Returns the task ID (used as the pause token).
   */
  createApprovalTask(opts: {
    executionId: string;
    workflowId: string;
    nodeId: string;
    config: Record<string, unknown>;
    requesterId?: number;
    approverIds?: number[];
    note?: string;
  }): Promise<string>;

  /**
   * Record an approval decision.
   * Returns the task ID that was decided.
   */
  decide(opts: {
    taskId: string;
    decision: ApprovalDecision;
    decidedBy?: number;
    note?: string;
  }): Promise<void>;

  /** Retrieve a task by its ID. */
  getTask(taskId: string): Promise<ApprovalTask | null>;

  /** Retrieve pending tasks for an execution. */
  getPendingTasksForExecution(executionId: string): Promise<ApprovalTask[]>;
}

export interface ApprovalTask {
  id: string;
  executionId: string;
  workflowId: string;
  nodeId: string;
  status: "pending" | "approved" | "rejected" | "timed_out";
  requesterId?: number;
  approverId?: number;
  note?: string;
  config: Record<string, unknown>;
  createdAt: Date;
  decidedAt?: Date;
}

// ─── Resume signal dispatcher ──────────────────────────────────────────────────

/**
 * Dispatched by external systems to resume a paused execution.
 *
 * In production, this should re-enqueue the execution job via BullMQ
 * with a special `resume` payload that includes the approval decision.
 * The execution engine then picks up from the last checkpoint.
 */
export interface ResumeDispatcher {
  dispatch(signal: ApprovalResumeSignal): Promise<void>;
}

// ─── In-memory approval store (dev / testing) ─────────────────────────────────

export class InMemoryApprovalStore implements ApprovalStore {
  private tasks = new Map<string, ApprovalTask>();
  private nextId = 1;

  async createApprovalTask(opts: {
    executionId: string;
    workflowId: string;
    nodeId: string;
    config: Record<string, unknown>;
    requesterId?: number;
    approverIds?: number[];
    note?: string;
  }): Promise<string> {
    const id = `task_${this.nextId++}`;
    this.tasks.set(id, {
      id,
      executionId: opts.executionId,
      workflowId: opts.workflowId,
      nodeId: opts.nodeId,
      status: "pending",
      requesterId: opts.requesterId,
      note: opts.note,
      config: opts.config,
      createdAt: new Date(),
    });
    return id;
  }

  async decide(opts: {
    taskId: string;
    decision: ApprovalDecision;
    decidedBy?: number;
    note?: string;
  }): Promise<void> {
    const task = this.tasks.get(opts.taskId);
    if (!task) throw new Error(`Approval task ${opts.taskId} not found`);
    task.status =
      opts.decision === "timed_out"
        ? "timed_out"
        : opts.decision === "approved"
          ? "approved"
          : "rejected";
    task.approverId = opts.decidedBy;
    task.note = opts.note ?? task.note;
    task.decidedAt = new Date();
  }

  async getTask(taskId: string): Promise<ApprovalTask | null> {
    return this.tasks.get(taskId) ?? null;
  }

  async getPendingTasksForExecution(
    executionId: string,
  ): Promise<ApprovalTask[]> {
    return [...this.tasks.values()].filter(
      (t) => t.executionId === executionId && t.status === "pending",
    );
  }
}

// ─── Timeout sweeper ──────────────────────────────────────────────────────────

/**
 * Periodically scans pending approval tasks and marks overdue ones as timed_out.
 * In production, integrate with the scheduler service.
 */
/**
 * Approval timeout sweeper with escalation chain and reminders.
 *
 * Per architecture.md §9.5:
 *   - Approval timeout defaults to 7 days
 *   - Escalation chain: if approver doesn't respond, escalate to next approver
 *   - Reminders sent 24h and 1h before timeout
 *   - On timeout: auto-approve / auto-reject / extend (configurable)
 *
 * The sweeper runs on a configurable interval (default 60s) and:
 *   1. Checks all pending approval tasks
 *   2. Sends reminders at 24h and 1h before timeout
 *   3. Escalates to the next approver in the chain if configured
 *   4. Times out the task if the deadline has passed
 */
export function startApprovalTimeoutSweeper(
  store: ApprovalStore,
  onTimeout: (task: ApprovalTask) => Promise<void>,
  onReminder?: (
    task: ApprovalTask,
    hoursBeforeTimeout: number,
  ) => Promise<void>,
  onEscalation?: (task: ApprovalTask, escalatedTo: string) => Promise<void>,
  intervalMs = 60_000,
): () => void {
  // Track which tasks have already received reminders to avoid duplicates
  const reminderSent24h = new Set<string>();
  const reminderSent1h = new Set<string>();
  const escalationApplied = new Set<string>();

  const timer = setInterval(async () => {
    const now = Date.now();
    if (store instanceof InMemoryApprovalStore) {
      const allTasks = await store.getPendingTasksForExecution("");
      for (const task of allTasks) {
        const timeoutMs =
          (task.config["timeoutMs"] as number | undefined) ??
          7 * 24 * 60 * 60 * 1000; // 7 days default
        const createdAt = task.createdAt.getTime();
        const deadline = createdAt + timeoutMs;
        const timeRemaining = deadline - now;

        // ── 1. Reminders (24h and 1h before timeout) ───────────────────────
        if (timeRemaining <= 24 * 60 * 60 * 1000 && timeRemaining > 0) {
          // 24h reminder
          if (!reminderSent24h.has(task.id)) {
            reminderSent24h.add(task.id);
            if (onReminder) {
              try {
                await onReminder(task, 24);
              } catch {
                // Reminder failure is non-fatal
              }
            }
          }
        }

        if (timeRemaining <= 60 * 60 * 1000 && timeRemaining > 0) {
          // 1h reminder
          if (!reminderSent1h.has(task.id)) {
            reminderSent1h.add(task.id);
            if (onReminder) {
              try {
                await onReminder(task, 1);
              } catch {
                // Reminder failure is non-fatal
              }
            }
          }
        }

        // ── 2. Escalation chain ─────────────────────────────────────────────
        // If the task has an escalation chain and the escalation threshold
        // (e.g., 50% of timeout) has passed, escalate to the next approver
        const escalationChain = task.config["escalationChain"] as
          | string[]
          | undefined;
        const escalationThresholdMs =
          (task.config["escalationThresholdMs"] as number | undefined) ??
          timeoutMs * 0.5; // Default: escalate at 50% of timeout

        if (
          escalationChain &&
          escalationChain.length > 0 &&
          !escalationApplied.has(task.id) &&
          timeRemaining < timeoutMs - escalationThresholdMs
        ) {
          escalationApplied.add(task.id);
          const escalatedTo = escalationChain[0];
          // Update the task's approver to the escalated approver
          task.approverId = Number(escalatedTo);
          if (onEscalation) {
            try {
              await onEscalation(task, escalatedTo);
            } catch {
              // Escalation notification failure is non-fatal
            }
          }
        }

        // ── 3. Timeout ──────────────────────────────────────────────────────
        if (timeRemaining <= 0) {
          // Clean up reminder/escalation tracking
          reminderSent24h.delete(task.id);
          reminderSent1h.delete(task.id);
          escalationApplied.delete(task.id);

          // Apply timeout action (auto-approve / auto-reject / extend)
          const timeoutAction =
            (task.config["timeoutAction"] as string | undefined) ??
            "auto_reject";

          if (timeoutAction === "extend") {
            // Extend the deadline by the original timeout duration
            task.createdAt = new Date();
            continue;
          }

          await store.decide({
            taskId: task.id,
            decision: "timed_out",
          });
          await onTimeout(task);
        }
      }
    }
  }, intervalMs);

  return () => clearInterval(timer);
}
