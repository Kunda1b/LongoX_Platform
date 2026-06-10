import { eq, sql } from "drizzle-orm";
import OpenAI from "openai";
import { publishEvent } from "@longox/shared-realtime";
import {
  db,
  executionsTable,
  executionCheckpointsTable,
  dlqEntriesTable,
  auditLogTable,
  workflowVersionsTable,
  workflowsTable,
  tokenUsageTable,
  usageEventsTable,
} from "@longox/db";

// ─── OpenAI client ─────────────────────────────────────────────────────────────

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Types ─────────────────────────────────────────────────────────────────────

interface WorkflowNode {
  id: string;
  name: string;
  type?: string;
  nodeTypeId?: string;
  position?: { x: number; y: number };
  config?: Record<string, unknown>;
}

// ─── Audit helper ──────────────────────────────────────────────────────────────

export async function writeAudit(
  action: string,
  resourceType: string,
  resourceId: string,
  metadata?: Record<string, unknown>,
  actorType = "system",
  actorId?: string,
) {
  await db.insert(auditLogTable).values({
    action,
    resourceType,
    resourceId,
    actorType,
    actorId: actorId ?? null,
    metadata: metadata ?? null,
  });
}

// ─── Node category helpers ──────────────────────────────────────────────────────

function nodeCategory(nodeTypeId: string): string {
  const prefix = nodeTypeId.split(".")[0] ?? "action";
  return ["trigger", "action", "logic", "ai", "data"].includes(prefix)
    ? prefix
    : "action";
}

function nodeDurationMs(category: string): number {
  switch (category) {
    case "trigger":
      return Math.floor(Math.random() * 80) + 20;
    case "logic":
      return Math.floor(Math.random() * 40) + 10;
    case "data":
      return Math.floor(Math.random() * 120) + 30;
    case "ai":
      return Math.floor(Math.random() * 1000) + 200;
    default:
      return Math.floor(Math.random() * 800) + 100;
  }
}

function nodeFailureProbability(category: string): number {
  switch (category) {
    case "trigger":
      return 0;
    case "logic":
      return 0.01;
    case "data":
      return 0.02;
    case "ai":
      return 0.02; // lower now that it's real
    default:
      return 0.04;
  }
}

// ─── Real AI execution ─────────────────────────────────────────────────────────

async function executeAiNode(
  nodeTypeId: string,
  config: Record<string, unknown>,
  input: Record<string, unknown>,
  workflowId: number,
): Promise<Record<string, unknown>> {
  const model = String(config.model ?? "gpt-4o-mini");
  let messages: OpenAI.ChatCompletionMessageParam[];
  let responseFormat: "text" | "json" = "text";

  if (nodeTypeId === "ai.classify") {
    const categories = String(config.categories ?? "CategoryA,CategoryB");
    messages = [
      {
        role: "system",
        content: `Classify the input into one of these categories: ${categories}. Respond with JSON: {"category": "...", "confidence": 0.0-1.0, "reasoning": "..."}`,
      },
      { role: "user", content: JSON.stringify(input) },
    ];
    responseFormat = "json";
  } else if (nodeTypeId === "ai.summarize") {
    const maxWords = Number(config.maxWords ?? 100);
    messages = [
      {
        role: "system",
        content: `Summarize the input in at most ${maxWords} words. Respond with JSON: {"summary": "...", "wordCount": 0}`,
      },
      { role: "user", content: JSON.stringify(input) },
    ];
    responseFormat = "json";
  } else if (nodeTypeId === "ai.extract") {
    const fields = String(config.fields ?? "vendor,amount,date");
    messages = [
      {
        role: "system",
        content: `Extract these fields from the input: ${fields}. Respond with JSON: {"extracted": {...}, "confidence": 0.0-1.0}`,
      },
      { role: "user", content: JSON.stringify(input) },
    ];
    responseFormat = "json";
  } else {
    // Generic AI node — use system prompt from config or a sensible default
    const systemPrompt = String(
      config.systemPrompt ??
        config.prompt ??
        "Process the following input and return a JSON result.",
    );
    messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: JSON.stringify(input) },
    ];
    responseFormat = "json";
  }

  const completion = await openai.chat.completions.create({
    model,
    messages,
    response_format:
      responseFormat === "json" ? { type: "json_object" } : undefined,
    max_tokens: Number(config.maxTokens ?? 1024),
  });

  const inputTokens = completion.usage?.prompt_tokens ?? 0;
  const outputTokens = completion.usage?.completion_tokens ?? 0;
  const content = completion.choices[0]?.message?.content ?? "{}";

  // Record token usage
  try {
    await db.insert(tokenUsageTable).values({
      modelName: model,
      provider: "openai",
      workflowId,
      inputTokens,
      outputTokens,
      cost: String(inputTokens * 0.00000015 + outputTokens * 0.0000006),
    });
  } catch {
    // Non-fatal — don't fail execution over metering
  }

  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = { result: content };
  }

  return { ...parsed, modelUsed: model, inputTokens, outputTokens };
}

// ─── Real HTTP execution ───────────────────────────────────────────────────────

async function executeHttpNode(
  config: Record<string, unknown>,
  input: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const url = String(config.url ?? "");
  if (!url) throw new Error("action.http: no url configured");

  const method = String(config.method ?? "GET").toUpperCase();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((config.headers as Record<string, string>) ?? {}),
  };

  const hasBody = ["POST", "PUT", "PATCH"].includes(method);
  const body = hasBody ? JSON.stringify(config.body ?? input) : undefined;

  const startMs = Date.now();
  const response = await fetch(url, { method, headers, body });
  const responseTimeMs = Date.now() - startMs;

  let responseBody: unknown;
  const contentType = response.headers.get("content-type") ?? "";
  try {
    responseBody = contentType.includes("application/json")
      ? await response.json()
      : await response.text();
  } catch {
    responseBody = null;
  }

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status} ${response.statusText} from ${url}`,
    );
  }

  return {
    statusCode: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    body: responseBody,
    responseTimeMs,
  };
}

// ─── Fallback simulation for non-AI, non-HTTP nodes ───────────────────────────

function simulateOutput(
  nodeTypeId: string,
  config: Record<string, unknown>,
  input: Record<string, unknown>,
): Record<string, unknown> {
  if (nodeTypeId.startsWith("trigger.")) {
    return {
      triggeredAt: new Date().toISOString(),
      payload: input,
      source: nodeTypeId.replace("trigger.", ""),
    };
  }
  if (nodeTypeId === "action.send_email") {
    return {
      messageId: `msg_${Math.random().toString(36).slice(2)}`,
      to: config.to ?? "recipient@example.com",
      subject: config.subject ?? "Notification",
      accepted: true,
      timestamp: new Date().toISOString(),
    };
  }
  if (nodeTypeId === "action.slack") {
    return {
      ts: `${Date.now() / 1000}`,
      channel: config.channel ?? "#general",
      ok: true,
      messageId: `slack_${Math.random().toString(36).slice(2)}`,
    };
  }
  if (nodeTypeId === "action.create_record") {
    return {
      id: Math.floor(Math.random() * 99999),
      object: config.object_type ?? "Record",
      createdAt: new Date().toISOString(),
      fields: {
        name: (input.name as string) ?? "New Record",
        status: "active",
      },
    };
  }
  if (nodeTypeId === "action.db_query") {
    const rows = Array.from(
      { length: Math.floor(Math.random() * 8) + 1 },
      (_, i) => ({ id: i + 1, value: Math.random() * 100 }),
    );
    return {
      rows,
      rowCount: rows.length,
      duration: `${Math.floor(Math.random() * 20) + 2}ms`,
    };
  }
  if (nodeTypeId === "action.spreadsheet") {
    return {
      updatedRange: "Sheet1!A2:E100",
      updatedRows: Math.floor(Math.random() * 5) + 1,
      spreadsheetId:
        config.spreadsheetId ?? "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms",
    };
  }
  if (nodeTypeId === "logic.if" || nodeTypeId === "logic.router") {
    return {
      branch: Math.random() > 0.5 ? "true" : "false",
      evaluated: true,
      condition: config.operator ?? "eq",
    };
  }
  if (nodeTypeId === "logic.filter") {
    const kept = Math.floor(Math.random() * 5) + 1;
    return {
      filtered: kept,
      total: kept + Math.floor(Math.random() * 5),
      passedItems: kept,
    };
  }
  if (nodeTypeId === "logic.loop") {
    return { iterations: Math.floor(Math.random() * 8) + 2, completed: true };
  }
  if (nodeTypeId === "logic.delay") {
    return {
      delayedMs: parseInt(String(config.duration ?? 1)) * 1000,
      resumedAt: new Date().toISOString(),
    };
  }
  if (nodeTypeId === "data.transform") {
    return {
      transformed: true,
      inputFields: Object.keys(input).length,
      outputFields: Object.keys(input).length + 2,
      schema: { id: "integer", name: "string", createdAt: "datetime" },
    };
  }
  if (nodeTypeId === "data.parse_doc") {
    return {
      text: "Extracted document text content. Invoice #12345. Total: $2,450.00. Due: 2025-02-15.",
      pages: 1,
      wordCount: 18,
    };
  }
  return {
    processed: true,
    timestamp: new Date().toISOString(),
    nodeType: nodeTypeId,
  };
}

function simulateError(nodeTypeId: string): string {
  const errors: Record<string, string[]> = {
    "action.send_email": [
      "SMTP connection refused",
      "Invalid recipient address",
      "Rate limit exceeded",
    ],
    "action.slack": [
      "Slack API error: channel_not_found",
      "Slack API error: not_in_channel",
    ],
    "action.create_record": [
      "Duplicate key constraint violation",
      "Required field 'email' missing",
    ],
    "action.db_query": [
      "Connection pool exhausted",
      "Query execution timeout (30s)",
      "Deadlock detected",
    ],
  };
  const nodeErrors = errors[nodeTypeId] ?? [
    "Unexpected error: internal service failure",
    "Step execution timed out",
  ];
  return (
    nodeErrors[Math.floor(Math.random() * nodeErrors.length)] ??
    "Unexpected error"
  );
}

// ─── Queue and Worker Engine ───────────────────────────────────────────────────

interface QueueJob {
  id: string;
  type: "workflow-execution" | "webhook-delivery" | "ai-run";
  data: any;
  attempts: number;
  maxAttempts: number;
}

class WorkflowJobQueue {
  private queue: QueueJob[] = [];
  private activeWorkers = 0;
  private maxConcurrency = 5;

  constructor() {
    // Start recovery process on initialization
    this.recoverJobs().catch((err) => {
      console.error("[Queue] Failed to recover interrupted jobs:", err);
    });
  }

  private async recoverJobs() {
    // Wait slightly for database pool to initialize
    await new Promise((r) => setTimeout(r, 1000));
    try {
      // Find executions stuck in "pending" or "running" in the database
      const pendingExecutions = await db
        .select()
        .from(executionsTable)
        .where(sql`${executionsTable.status} IN ('pending', 'running')`)
        .orderBy(executionsTable.startedAt);

      if (pendingExecutions.length > 0) {
        console.log(
          `[Queue] Recovered ${pendingExecutions.length} interrupted executions.`,
        );
      }

      for (const exec of pendingExecutions) {
        const [workflow] = await db
          .select()
          .from(workflowsTable)
          .where(eq(workflowsTable.id, exec.workflowId))
          .limit(1);

        if (workflow) {
          const nodes = Array.isArray(workflow.nodes)
            ? (workflow.nodes as any[])
            : [];
          this.addJob("workflow-execution", {
            executionId: exec.id,
            workflowId: exec.workflowId,
            workflowName: exec.workflowName,
            nodes,
            triggerPayload: {},
            triggerType: "manual",
          });
        } else {
          await db
            .update(executionsTable)
            .set({
              status: "failed",
              errorMessage: "Workflow no longer exists",
              finishedAt: new Date(),
            })
            .where(eq(executionsTable.id, exec.id));
        }
      }
    } catch (err) {
      console.error("[Queue] Database recovery error:", err);
    }
  }

  public addJob(
    type: "workflow-execution" | "webhook-delivery" | "ai-run",
    data: any,
    maxAttempts = 2,
  ) {
    const job: QueueJob = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type,
      data,
      attempts: 0,
      maxAttempts,
    };
    this.queue.push(job);
    this.processQueue();
  }

  private async processQueue() {
    if (this.activeWorkers >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    const job = this.queue.shift()!;
    this.activeWorkers++;

    this.runJob(job)
      .catch((err) => {
        console.error(`[Queue] Job execution error on job ${job.id}:`, err);
      })
      .finally(() => {
        this.activeWorkers--;
        this.processQueue();
      });

    this.processQueue();
  }

  private async runJob(job: QueueJob) {
    job.attempts++;
    console.log(
      `[Queue] Running job ${job.id} (attempt ${job.attempts}/${job.maxAttempts})`,
    );

    try {
      if (job.type === "workflow-execution") {
        const {
          executionId,
          workflowId,
          workflowName,
          nodes,
          triggerPayload,
          triggerType,
        } = job.data;

        await db
          .update(executionsTable)
          .set({ status: "running" })
          .where(eq(executionsTable.id, executionId));

        await runWorkflow(
          executionId,
          workflowId,
          workflowName,
          nodes,
          triggerPayload,
          triggerType,
        );
      } else if (job.type === "webhook-delivery") {
        const { workflowId, payload } = job.data;
        const [workflow] = await db
          .select()
          .from(workflowsTable)
          .where(eq(workflowsTable.id, workflowId))
          .limit(1);
        if (workflow) {
          const nodes = Array.isArray(workflow.nodes)
            ? (workflow.nodes as any[])
            : [];
          await startWorkflowExecution(
            workflowId,
            workflow.name,
            nodes,
            "webhook",
            payload,
          );
        }
      } else if (job.type === "ai-run") {
        const { nodeTypeId, config, input, workflowId } = job.data;
        await executeAiNode(nodeTypeId, config, input, workflowId);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[Queue] Job ${job.id} failed:`, errMsg);

      if (job.attempts < job.maxAttempts) {
        // Exponential backoff or simple delay retry
        setTimeout(() => {
          this.queue.push(job);
          this.processQueue();
        }, 2000);
      } else {
        if (job.type === "workflow-execution") {
          const { executionId, workflowId } = job.data;
          await db
            .update(executionsTable)
            .set({
              status: "failed",
              finishedAt: new Date(),
              errorMessage: `Job execution failed after max retry attempts: ${errMsg}`,
            })
            .where(eq(executionsTable.id, executionId));
          await db
            .update(workflowsTable)
            .set({ lastRunStatus: "failed", lastRunAt: new Date() })
            .where(eq(workflowsTable.id, workflowId));
          await writeAudit(
            "execution.failed",
            "execution",
            String(executionId),
            { workflowId, error: errMsg },
          );
        }
      }
    }
  }
}

export const jobQueue = new WorkflowJobQueue();

// ─── Core runner (executes workflow nodes sequentially) ───────────────────────

export async function runWorkflow(
  executionId: number,
  workflowId: number,
  workflowName: string,
  nodes: WorkflowNode[],
  triggerPayload: Record<string, unknown> = {},
  triggerType = "manual",
): Promise<void> {
  const sorted = [...nodes].sort(
    (a, b) => (a.position?.x ?? 0) - (b.position?.x ?? 0),
  );

  await writeAudit("execution.started", "execution", String(executionId), {
    workflowId,
    workflowName,
    triggerType,
    nodeCount: sorted.length,
  });

  let currentInput: Record<string, unknown> = {
    ...triggerPayload,
    _triggerType: triggerType,
  };
  let failed = false;

  // Resuming checkpoints check
  const checkpoints = await db
    .select()
    .from(executionCheckpointsTable)
    .where(eq(executionCheckpointsTable.executionId, executionId))
    .orderBy(executionCheckpointsTable.startedAt);

  const successfulCheckpoints = checkpoints.filter(
    (c) => c.status === "success",
  );
  const completedNodeIds = new Set(successfulCheckpoints.map((c) => c.nodeId));

  if (successfulCheckpoints.length > 0) {
    const lastCompleted =
      successfulCheckpoints[successfulCheckpoints.length - 1];
    if (lastCompleted.outputData) {
      currentInput = {
        ...((lastCompleted.outputData ?? {}) as Record<string, unknown>),
        _prevNode: lastCompleted.nodeId,
      };
    }
  }

  for (const node of sorted) {
    // Skip already completed nodes (Checkpoint Recovery)
    if (completedNodeIds.has(node.id)) {
      continue;
    }

    const nodeTypeId = node.nodeTypeId ?? node.type ?? "action.http";
    const category = nodeCategory(nodeTypeId);
    const config = (node.config ?? {}) as Record<string, unknown>;
    const isAiNode = category === "ai";
    const isHttpNode = nodeTypeId === "action.http";
    const maxAttempts = category === "trigger" ? 1 : 2;

    let lastError: string | null = null;
    let succeeded = false;
    let finalOutput: Record<string, unknown> | null = null;
    let finalDuration = 0;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const startedAt = new Date();

      const [checkpoint] = await db
        .insert(executionCheckpointsTable)
        .values({
          executionId,
          nodeId: node.id,
          nodeName: node.name,
          nodeType: nodeTypeId,
          status: "running",
          attemptNumber: attempt,
          inputData: currentInput,
          startedAt,
        })
        .returning();

      let output: Record<string, unknown>;
      let execError: string | null = null;

      try {
        if (isAiNode && process.env.OPENAI_API_KEY) {
          output = await executeAiNode(
            nodeTypeId,
            config,
            currentInput,
            workflowId,
          );
        } else if (isHttpNode) {
          output = await executeHttpNode(config, currentInput);
        } else {
          // Simulate timing for non-real nodes
          await new Promise((r) => setTimeout(r, nodeDurationMs(category)));
          const willFail = Math.random() < nodeFailureProbability(category);
          if (willFail) throw new Error(simulateError(nodeTypeId));
          output = simulateOutput(nodeTypeId, config, currentInput);
        }
      } catch (err) {
        execError = err instanceof Error ? err.message : String(err);
      }

      const duration = Date.now() - startedAt.getTime();

      if (execError) {
        lastError = execError;
        await db
          .update(executionCheckpointsTable)
          .set({
            status: "failed",
            errorMessage: lastError,
            completedAt: new Date(),
            durationMs: duration,
          })
          .where(eq(executionCheckpointsTable.id, checkpoint.id));
        if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, 500));
      } else {
        finalOutput = output!;
        finalDuration = duration;
        await db
          .update(executionCheckpointsTable)
          .set({
            status: "success",
            outputData: output!,
            completedAt: new Date(),
            durationMs: duration,
          })
          .where(eq(executionCheckpointsTable.id, checkpoint.id));
        succeeded = true;
        break;
      }
    }

    if (!succeeded) {
      await db.insert(dlqEntriesTable).values({
        executionId,
        workflowId,
        workflowName,
        nodeId: node.id,
        nodeName: node.name,
        nodeType: nodeTypeId,
        errorMessage: lastError ?? "Unknown error",
        attempts: maxAttempts,
        jobData: { nodeTypeId, config, lastInput: currentInput },
      });

      await writeAudit(
        "execution.node_failed",
        "execution",
        String(executionId),
        {
          nodeId: node.id,
          nodeName: node.name,
          nodeType: nodeTypeId,
          error: lastError,
        },
      );

      await db
        .update(executionsTable)
        .set({
          status: "failed",
          finishedAt: new Date(),
          durationMs: sql`EXTRACT(EPOCH FROM (NOW() - ${executionsTable.startedAt})) * 1000`,
          errorMessage: `Node "${node.name}" failed after ${maxAttempts} attempt(s): ${lastError}`,
        })
        .where(eq(executionsTable.id, executionId));

      await db
        .update(workflowsTable)
        .set({ lastRunStatus: "failed", lastRunAt: new Date() })
        .where(eq(workflowsTable.id, workflowId));
      await writeAudit("execution.failed", "execution", String(executionId), {
        workflowId,
        failedNode: node.name,
        error: lastError,
      });
      failed = true;
      break;
    }

    if (finalOutput) currentInput = { ...finalOutput, _prevNode: node.id };
  }

  if (!failed) {
    const [exec] = await db
      .select()
      .from(executionsTable)
      .where(eq(executionsTable.id, executionId));
    const durationMs = exec ? Date.now() - exec.startedAt.getTime() : 0;

    await db
      .update(executionsTable)
      .set({ status: "success", finishedAt: new Date(), durationMs })
      .where(eq(executionsTable.id, executionId));
    await db
      .update(workflowsTable)
      .set({ lastRunStatus: "success", lastRunAt: new Date() })
      .where(eq(workflowsTable.id, workflowId));
    await writeAudit("execution.completed", "execution", String(executionId), {
      workflowId,
      workflowName,
      durationMs,
    });

    // Record metering event
    try {
      await db.insert(usageEventsTable).values({
        workflowId,
        workflowName,
        eventType: "workflow.execution.completed",
        quantity: sorted.length,
        metadata: {
          executionId,
          durationMs,
          nodeCount: sorted.length,
          triggerType,
        },
      });
    } catch {
      // Non-fatal
    }
  }
}

// ─── Create execution + queue job ──────────────────────────────────────────────

export async function startWorkflowExecution(
  workflowId: number,
  workflowName: string,
  nodes: WorkflowNode[],
  triggerType: "manual" | "webhook" | "schedule" | "api",
  triggerPayload: Record<string, unknown> = {},
): Promise<typeof executionsTable.$inferSelect> {
  const [execution] = await db
    .insert(executionsTable)
    .values({
      workflowId,
      workflowName,
      status: "pending",
      startedAt: new Date(),
      steps: [],
    })
    .returning();

  await db
    .update(workflowsTable)
    .set({
      executionCount: sql`${workflowsTable.executionCount} + 1`,
      lastRunAt: new Date(),
      lastRunStatus: "running",
    })
    .where(eq(workflowsTable.id, workflowId));

  await writeAudit(
    "execution.started",
    "workflow",
    String(workflowId),
    { executionId: execution.id, triggerType, workflowName },
    triggerType === "webhook" ? "webhook" : "user",
  );

  publishEvent({
    type: "execution.started",
    aggregateId: String(execution.id),
    aggregateType: "execution",
    payload: { workflowId, workflowName, triggerType },
    actorId: String(0),
    actorType: triggerType === "webhook" ? "webhook" : "system",
  });

  // Save a version snapshot on each run (only if nodes exist)
  if (nodes.length > 0) {
    const existing = await db
      .select({ version: workflowVersionsTable.version })
      .from(workflowVersionsTable)
      .where(eq(workflowVersionsTable.workflowId, workflowId))
      .orderBy(sql`${workflowVersionsTable.version} DESC`)
      .limit(1);
    const nextVersion = (existing[0]?.version ?? 0) + 1;
    if (nextVersion <= 1 || nodes.length > 0) {
      await db
        .insert(workflowVersionsTable)
        .values({
          workflowId,
          version: nextVersion,
          name: workflowName,
          nodes,
          changeNote: `Auto-snapshot on execution (${triggerType})`,
        })
        .onConflictDoNothing();
    }
  }

  // Queue the job instead of inline execution
  jobQueue.addJob(
    "workflow-execution",
    {
      executionId: execution.id,
      workflowId,
      workflowName,
      nodes,
      triggerPayload,
      triggerType,
    },
    2,
  );

  return execution;
}
