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
    executionId: number;
    workflowId: number;
    nodeId: string;
    config: Record<string, unknown>;
    requesterId?: number;
    approverIds?: number[];
    note?: string;
  }): Promise<number>;

  /**
   * Record an approval decision.
   * Returns the task ID that was decided.
   */
  decide(opts: {
    taskId: number;
    decision: ApprovalDecision;
    decidedBy?: number;
    note?: string;
  }): Promise<void>;

  /** Retrieve a task by its ID. */
  getTask(taskId: number): Promise<ApprovalTask | null>;

  /** Retrieve pending tasks for an execution. */
  getPendingTasksForExecution(executionId: number): Promise<ApprovalTask[]>;
}

export interface ApprovalTask {
  id: number;
  executionId: number;
  workflowId: number;
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
  private tasks = new Map<number, ApprovalTask>();
  private nextId = 1;

  async createApprovalTask(opts: {
    executionId: number;
    workflowId: number;
    nodeId: string;
    config: Record<string, unknown>;
    requesterId?: number;
    approverIds?: number[];
    note?: string;
  }): Promise<number> {
    const id = this.nextId++;
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
    taskId: number;
    decision: ApprovalDecision;
    decidedBy?: number;
    note?: string;
  }): Promise<void> {
    const task = this.tasks.get(opts.taskId);
    if (!task) throw new Error(`Approval task ${opts.taskId} not found`);
    task.status = opts.decision === "timed_out" ? "timed_out" : opts.decision === "approved" ? "approved" : "rejected";
    task.approverId = opts.decidedBy;
    task.note = opts.note ?? task.note;
    task.decidedAt = new Date();
  }

  async getTask(taskId: number): Promise<ApprovalTask | null> {
    return this.tasks.get(taskId) ?? null;
  }

  async getPendingTasksForExecution(executionId: number): Promise<ApprovalTask[]> {
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
export function startApprovalTimeoutSweeper(
  store: ApprovalStore,
  onTimeout: (task: ApprovalTask) => Promise<void>,
  intervalMs = 60_000,
): () => void {
  const timer = setInterval(async () => {
    // This is a simplified sweep — production should query the DB directly.
    const now = Date.now();
    if (store instanceof InMemoryApprovalStore) {
      const allTasks = await store.getPendingTasksForExecution(-1);
      for (const task of allTasks) {
        const timeoutMs =
          (task.config["timeoutMs"] as number | undefined) ?? 7 * 24 * 60 * 60 * 1000;
        if (now - task.createdAt.getTime() > timeoutMs) {
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
