/**
 * Evaluation gate service.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.aiPrompt`, `prisma.aiEvalDataset`, and `prisma.aiEvalRun`
 * delegates with `as any` casts for legacy columns.
 */

import { prisma } from "@longox/db/prisma";
import { evaluationService } from "../../evaluation/evaluation-service";

export interface GateResult {
  passed: boolean;
  score: number;
  baselineScore: number;
  diff: number;
  failedGates: string[];
}

export class EvaluationGateService {
  private readonly regressionThreshold = -0.1;

  async evaluatePrompt(promptId: string, version: number): Promise<GateResult> {
    const prompt = await prisma.aiPrompt.findUnique({
      where: { id: promptId } as any,
    });

    if (!prompt) {
      throw new Error(`Prompt ${promptId} not found`);
    }

    const datasets = await prisma.aiEvalDataset.findMany({
      where: { promptId } as any,
    });

    if (datasets.length === 0) {
      return {
        passed: true,
        score: 1,
        baselineScore: 1,
        diff: 0,
        failedGates: [],
      };
    }

    const recentRuns = await prisma.aiEvalRun.findMany({
      where: {
        promptId,
        status: "completed",
      } as any,
      orderBy: { createdAt: "desc" } as any,
      take: 5,
    });

    const baselineScore =
      recentRuns.length > 0 ? Number((recentRuns[0] as any).score ?? 1) : 1;

    let totalScore = 0;
    let sampleCount = 0;
    const failedGates: string[] = [];

    for (const dataset of datasets as any[]) {
      // The `samples` field is stored inside `metadata` (the schema has no
      // dedicated `samples` column). Cast defensively to read it.
      const samples =
        (dataset.metadata?.samples as Array<{
          input: string;
          expected?: string;
        }>) ?? [];

      for (const sample of samples) {
        const evalResult = evaluationService.evaluate(
          sample.input,
          sample.expected,
        );
        totalScore += evalResult.score;
        sampleCount++;

        if (evalResult.score < 0.5) {
          failedGates.push(...evalResult.feedback);
        }
      }
    }

    const score = sampleCount > 0 ? totalScore / sampleCount : 1;
    const diff = score - baselineScore;
    const passed = diff >= this.regressionThreshold;

    return { passed, score, baselineScore, diff, failedGates };
  }

  async checkRegression(
    promptId: string,
    candidateVersion: number,
    baselineVersion: number,
  ): Promise<GateResult> {
    const baselineRun = await prisma.aiEvalRun.findFirst({
      where: {
        promptId,
        promptVersion: baselineVersion,
        status: "completed",
      } as any,
      orderBy: { createdAt: "desc" } as any,
    });

    const baselineScore = baselineRun ? Number((baselineRun as any).score ?? 1) : 1;

    const candidateRun = await prisma.aiEvalRun.findFirst({
      where: {
        promptId,
        promptVersion: candidateVersion,
        status: "completed",
      } as any,
      orderBy: { createdAt: "desc" } as any,
    });

    const score = candidateRun ? Number((candidateRun as any).score ?? 1) : 1;
    const diff = score - baselineScore;
    const passed = diff >= this.regressionThreshold;

    const failedGates: string[] = [];
    if (!passed) {
      failedGates.push(
        `Regression detected: candidate score ${score.toFixed(3)} vs baseline ${baselineScore.toFixed(3)} (diff: ${diff.toFixed(3)})`,
      );
    }

    return { passed, score, baselineScore, diff, failedGates };
  }
}

export const evaluationGateService = new EvaluationGateService();
