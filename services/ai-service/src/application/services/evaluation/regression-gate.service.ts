/**
 * Regression gate service.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.aiEvalRun`, `prisma.aiEvalDataset`, and `prisma.aiPrompt`
 * delegates with `as any` casts for legacy columns.
 */

import { prisma } from "@longox/db/prisma";
import { evaluationRunService } from "./evaluation-run.service";

export interface RegressionResult {
  passed: boolean;
  score: number;
  baselineScore: number | null;
  diff: number | null;
  details: {
    runId: string;
    threshold: number;
    totalEntries: number;
    passedEntries: number;
    failedEntries: number;
  };
}

export interface PromotionGateResult {
  allowed: boolean;
  reason?: string;
  score?: number;
  baseline?: number | null;
}

export class RegressionGateService {
  async evaluateRegression(
    promptId: string,
    candidateVersion: number,
    options?: { datasetId?: string; threshold?: number },
  ): Promise<RegressionResult> {
    const prompt = await prisma.aiPrompt.findUnique({
      where: { id: promptId } as any,
    });

    if (!prompt) throw new Error(`Prompt ${promptId} not found`);

    let datasetId = options?.datasetId;

    if (!datasetId) {
      const dataset = await prisma.aiEvalDataset.findFirst({
        where: { promptId } as any,
      });

      if (dataset) {
        datasetId = dataset.id;
      }
    }

    if (!datasetId) {
      throw new Error(
        `No evaluation dataset found for prompt ${promptId}. Provide a datasetId.`,
      );
    }

    const threshold = options?.threshold ?? 70;

    const run = await evaluationRunService.createRun({
      datasetId,
      promptId,
      promptVersion: candidateVersion,
      threshold,
      tenantId: prompt.id,
    });

    const completedRun: any = await evaluationRunService.executeRun(run.id);

    const baselineScore = await this.getStoredBaselineScore(promptId);

    const score = completedRun?.score ?? 0;
    const diff = baselineScore !== null ? score - baselineScore : null;
    const passed = score >= threshold;

    return {
      passed,
      score,
      baselineScore,
      diff,
      details: {
        runId: completedRun?.id ?? run.id,
        threshold,
        totalEntries: completedRun?.totalEntries ?? 0,
        passedEntries: completedRun?.passedEntries ?? 0,
        failedEntries: completedRun?.failedEntries ?? 0,
      },
    };
  }

  async checkPromotionGate(
    promptId: string,
    candidateVersion: number,
    targetEnvironment: string,
  ): Promise<PromotionGateResult> {
    try {
      const regression = await this.evaluateRegression(promptId, candidateVersion);

      if (!regression.passed) {
        return {
          allowed: false,
          reason: `Score ${(regression.score * 100).toFixed(1)}% is below threshold.`,
          score: regression.score,
          baseline: regression.baselineScore,
        };
      }

      if (
        regression.baselineScore !== null &&
        regression.diff !== null &&
        regression.diff < -0.05
      ) {
        return {
          allowed: false,
          reason: `Score dropped ${(Math.abs(regression.diff) * 100).toFixed(1)}% from baseline ${(regression.baselineScore * 100).toFixed(1)}%.`,
          score: regression.score,
          baseline: regression.baselineScore,
        };
      }

      return {
        allowed: true,
        score: regression.score,
        baseline: regression.baselineScore,
      };
    } catch (error) {
      return {
        allowed: false,
        reason: error instanceof Error ? error.message : "Regression check failed",
      };
    }
  }

  async setBaseline(promptId: string, version: number) {
    const lastRun = await prisma.aiEvalRun.findFirst({
      where: { promptId } as any,
      orderBy: { createdAt: "desc" } as any,
    });

    if (!lastRun) {
      throw new Error(
        `No completed runs found for prompt ${promptId}. Run an evaluation first.`,
      );
    }

    return {
      promptId,
      version,
      baselineScore: (lastRun as any).score,
      runId: lastRun.id,
    };
  }

  async getBaseline(promptId: string) {
    const score = await this.getStoredBaselineScore(promptId);
    return score !== null ? { promptId, baselineScore: score } : null;
  }

  private async getStoredBaselineScore(
    promptId: string,
  ): Promise<number | null> {
    const lastRun = await prisma.aiEvalRun.findFirst({
      where: { promptId } as any,
      orderBy: { createdAt: "desc" } as any,
    });

    return (lastRun as any)?.score ?? null;
  }
}

export const regressionGateService = new RegressionGateService();
