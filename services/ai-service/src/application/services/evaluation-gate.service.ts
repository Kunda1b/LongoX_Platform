import { db, aiEvaluationDatasetsTable, aiEvaluationRunsTable, promptsTable } from "@longox/db";
import { eq, and, gte, desc } from "drizzle-orm";
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

  async evaluatePrompt(
    promptId: number,
    version: number,
  ): Promise<GateResult> {
    const [prompt] = await db
      .select()
      .from(promptsTable)
      .where(eq(promptsTable.id, promptId));

    if (!prompt) {
      throw new Error(`Prompt ${promptId} not found`);
    }

    const datasets = await db
      .select()
      .from(aiEvaluationDatasetsTable)
      .where(eq(aiEvaluationDatasetsTable.promptId, promptId));

    if (datasets.length === 0) {
      return {
        passed: true,
        score: 1,
        baselineScore: 1,
        diff: 0,
        failedGates: [],
      };
    }

    const recentRuns = await db
      .select()
      .from(aiEvaluationRunsTable)
      .where(
        and(
          eq(aiEvaluationRunsTable.promptId, promptId),
          eq(aiEvaluationRunsTable.status, "completed"),
        ),
      )
      .orderBy(desc(aiEvaluationRunsTable.createdAt))
      .limit(5);

    const baselineScore = recentRuns.length > 0
      ? Number(recentRuns[0].overallScore ?? 1)
      : 1;

    let totalScore = 0;
    let sampleCount = 0;
    const failedGates: string[] = [];

    for (const dataset of datasets) {
      const samples = (dataset.samples as Array<{ input: string; expected?: string }>) ?? [];

      for (const sample of samples) {
        const evalResult = evaluationService.evaluate(sample.input, sample.expected);
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
    promptId: number,
    candidateVersion: number,
    baselineVersion: number,
  ): Promise<GateResult> {
    const [baselineRun] = await db
      .select()
      .from(aiEvaluationRunsTable)
      .where(
        and(
          eq(aiEvaluationRunsTable.promptId, promptId),
          eq(aiEvaluationRunsTable.promptVersionId, baselineVersion),
          eq(aiEvaluationRunsTable.status, "completed"),
        ),
      )
      .orderBy(desc(aiEvaluationRunsTable.createdAt))
      .limit(1);

    const baselineScore = baselineRun ? Number(baselineRun.overallScore ?? 1) : 1;

    const [candidateRun] = await db
      .select()
      .from(aiEvaluationRunsTable)
      .where(
        and(
          eq(aiEvaluationRunsTable.promptId, promptId),
          eq(aiEvaluationRunsTable.promptVersionId, candidateVersion),
          eq(aiEvaluationRunsTable.status, "completed"),
        ),
      )
      .orderBy(desc(aiEvaluationRunsTable.createdAt))
      .limit(1);

    const score = candidateRun ? Number(candidateRun.overallScore ?? 1) : 1;
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
