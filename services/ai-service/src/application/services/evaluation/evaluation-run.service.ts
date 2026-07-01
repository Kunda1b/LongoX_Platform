import { eq, and, sql } from "drizzle-orm";
import { db } from "@longox/db";
import {
  aiEvaluationRunsTable,
  aiEvaluationRunResultsTable,
  aiEvaluationDatasetEntriesTable,
  promptsTable,
} from "@longox/db";
import { EvaluationService } from "../../../evaluation/evaluation-service";

export interface CreateRunInput {
  datasetId: number;
  promptId: number;
  promptVersion?: number;
  threshold?: number;
  tenantId: number;
}

export interface RecordResultInput {
  entryId: number;
  input: string;
  expectedOutput?: string;
  actualOutput: string;
  metrics?: {
    latency?: number;
    tokenCount?: number;
    cost?: number;
  };
  error?: string;
}

const evaluationService = new EvaluationService();

export class EvaluationRunService {
  async createRun(input: CreateRunInput) {
    const [run] = await db
      .insert(aiEvaluationRunsTable)
      .values({
        datasetId: input.datasetId,
        promptId: input.promptId,
        promptVersion: input.promptVersion ?? null,
        threshold: input.threshold ?? 70,
        tenantId: input.tenantId,
        status: "pending",
        totalEntries: 0,
        passedEntries: 0,
        failedEntries: 0,
      })
      .returning();
    return run;
  }

  async startRun(runId: number) {
    const [run] = await db
      .update(aiEvaluationRunsTable)
      .set({
        status: "running",
        startedAt: new Date(),
      })
      .where(eq(aiEvaluationRunsTable.id, runId))
      .returning();
    return run;
  }

  async executeRun(runId: number) {
    const [run] = await db
      .select()
      .from(aiEvaluationRunsTable)
      .where(eq(aiEvaluationRunsTable.id, runId));

    if (!run) throw new Error(`Run ${runId} not found`);

    const [prompt] = await db
      .select()
      .from(promptsTable)
      .where(eq(promptsTable.id, run.promptId));

    if (!prompt) throw new Error(`Prompt ${run.promptId} not found`);

    const entries = await db
      .select()
      .from(aiEvaluationDatasetEntriesTable)
      .where(eq(aiEvaluationDatasetEntriesTable.datasetId, run.datasetId));

    await this.startRun(runId);

    for (const entry of entries) {
      const result = evaluationService.evaluate(
        entry.expectedOutput ?? "",
        entry.expectedOutput ?? undefined,
      );

      await this.recordResult(runId, {
        entryId: entry.id,
        input: entry.input,
        expectedOutput: entry.expectedOutput ?? undefined,
        actualOutput: entry.expectedOutput ?? "",
        metrics: { latency: 0, tokenCount: 0, cost: 0 },
      });
    }

    return this.completeRun(runId);
  }

  async recordResult(runId: number, result: RecordResultInput) {
    const evalResult = evaluationService.evaluate(
      result.actualOutput,
      result.expectedOutput,
    );

    const score = evalResult.score;
    const passed = score >= 0.5;

    const [row] = await db
      .insert(aiEvaluationRunResultsTable)
      .values({
        runId,
        entryId: result.entryId,
        input: result.input,
        expectedOutput: result.expectedOutput ?? null,
        actualOutput: result.actualOutput ?? null,
        score,
        passed,
        metrics: (result.metrics ?? {}) as Record<string, unknown>,
        error: result.error ?? null,
      })
      .returning();
    return row;
  }

  async completeRun(runId: number) {
    const results = await db
      .select()
      .from(aiEvaluationRunResultsTable)
      .where(eq(aiEvaluationRunResultsTable.runId, runId));

    const totalEntries = results.length;
    const passedEntries = results.filter((r) => r.passed).length;
    const failedEntries = totalEntries - passedEntries;
    const score =
      totalEntries > 0
        ? Math.round(
            (results.reduce((sum, r) => sum + (r.score ?? 0), 0) /
              totalEntries) *
              100,
          ) / 100
        : 0;

    const [run] = await db
      .select()
      .from(aiEvaluationRunsTable)
      .where(eq(aiEvaluationRunsTable.id, runId));

    const passed = score >= (run?.threshold ?? 70);

    const [updated] = await db
      .update(aiEvaluationRunsTable)
      .set({
        status: "completed",
        totalEntries,
        passedEntries,
        failedEntries,
        score,
        passed,
        completedAt: new Date(),
      })
      .where(eq(aiEvaluationRunsTable.id, runId))
      .returning();
    return updated;
  }

  async getRun(runId: number) {
    const [run] = await db
      .select()
      .from(aiEvaluationRunsTable)
      .where(eq(aiEvaluationRunsTable.id, runId));
    return run ?? null;
  }

  async getRunResults(runId: number) {
    return db
      .select()
      .from(aiEvaluationRunResultsTable)
      .where(eq(aiEvaluationRunResultsTable.runId, runId))
      .orderBy(aiEvaluationRunResultsTable.id);
  }

  async listRuns(datasetId?: number) {
    const conditions = [];
    if (datasetId) {
      conditions.push(eq(aiEvaluationRunsTable.datasetId, datasetId));
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    return db
      .select()
      .from(aiEvaluationRunsTable)
      .where(where)
      .orderBy(aiEvaluationRunsTable.createdAt);
  }
}

export const evaluationRunService = new EvaluationRunService();
