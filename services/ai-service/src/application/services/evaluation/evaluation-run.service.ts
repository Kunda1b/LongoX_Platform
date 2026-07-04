/**
 * Evaluation run service.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.aiEvalRun`, `prisma.aiEvalRunResult`, `prisma.aiEvalDatasetEntry`,
 * and `prisma.aiPrompt` delegates with `as any` casts for legacy columns.
 */

import { prisma } from "@longox/db/prisma";
import { EvaluationService } from "../../../evaluation/evaluation-service";

export interface CreateRunInput {
  datasetId: string;
  promptId: string;
  promptVersion?: number;
  threshold?: number;
  tenantId: string;
}

export interface RecordResultInput {
  entryId: string;
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
    const run = await prisma.aiEvalRun.create({
      data: {
        datasetId: input.datasetId,
        promptId: input.promptId,
        promptVersion: input.promptVersion ?? null,
        threshold: input.threshold ?? 70,
        tenantId: input.tenantId,
        status: "pending",
        totalEntries: 0,
        passedEntries: 0,
        failedEntries: 0,
      } as any,
    });
    return run;
  }

  async startRun(runId: string) {
    const run = await prisma.aiEvalRun.update({
      where: { id: runId } as any,
      data: {
        status: "running",
        startedAt: new Date(),
      } as any,
    });
    return run;
  }

  async executeRun(runId: string) {
    const run = await prisma.aiEvalRun.findUnique({
      where: { id: runId } as any,
    });

    if (!run) throw new Error(`Run ${runId} not found`);

    const prompt = await prisma.aiPrompt.findUnique({
      where: { id: (run as any).promptId } as any,
    });

    if (!prompt) throw new Error(`Prompt ${(run as any).promptId} not found`);

    const entries = await prisma.aiEvalDatasetEntry.findMany({
      where: { datasetId: (run as any).datasetId } as any,
    });

    await this.startRun(runId);

    for (const entry of entries as any[]) {
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

  async recordResult(runId: string, result: RecordResultInput) {
    const evalResult = evaluationService.evaluate(
      result.actualOutput,
      result.expectedOutput,
    );

    const score = evalResult.score;
    const passed = score >= 0.5;

    const row = await prisma.aiEvalRunResult.create({
      data: {
        runId,
        entryId: result.entryId,
        input: result.input,
        expectedOutput: result.expectedOutput ?? null,
        actualOutput: result.actualOutput ?? null,
        score,
        passed,
        metrics: (result.metrics ?? {}) as Record<string, unknown>,
        error: result.error ?? null,
      } as any,
    });
    return row;
  }

  async completeRun(runId: string) {
    const results = await prisma.aiEvalRunResult.findMany({
      where: { runId } as any,
    });

    const totalEntries = results.length;
    const passedEntries = (results as any[]).filter((r) => r.passed).length;
    const failedEntries = totalEntries - passedEntries;
    const score =
      totalEntries > 0
        ? Math.round(
            ((results as any[]).reduce((sum, r) => sum + (r.score ?? 0), 0) /
              totalEntries) *
              100,
          ) / 100
        : 0;

    const run = await prisma.aiEvalRun.findUnique({
      where: { id: runId } as any,
    });

    const passed = score >= ((run as any)?.threshold ?? 70);

    const updated = await prisma.aiEvalRun.update({
      where: { id: runId } as any,
      data: {
        status: "completed",
        totalEntries,
        passedEntries,
        failedEntries,
        score,
        passed,
        completedAt: new Date(),
      } as any,
    });
    return updated;
  }

  async getRun(runId: string) {
    const run = await prisma.aiEvalRun.findUnique({
      where: { id: runId } as any,
    });
    return run ?? null;
  }

  async getRunResults(runId: string) {
    return prisma.aiEvalRunResult.findMany({
      where: { runId } as any,
      orderBy: { id: "asc" } as any,
    });
  }

  async listRuns(datasetId?: string) {
    return prisma.aiEvalRun.findMany({
      where: datasetId ? ({ datasetId } as any) : ({} as any),
      orderBy: { createdAt: "asc" } as any,
    });
  }
}

export const evaluationRunService = new EvaluationRunService();
