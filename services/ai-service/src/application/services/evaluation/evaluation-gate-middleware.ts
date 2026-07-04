import { regressionGateService } from "./regression-gate.service";

export class EvaluationGateBlockedError extends Error {
  public blocked: boolean;
  public score: number | undefined;
  public baseline: number | null | undefined;
  public reason: string;

  constructor(details: {
    blocked: boolean;
    score?: number;
    baseline?: number | null;
    reason: string;
  }) {
    super(details.reason);
    this.name = "EvaluationGateBlockedError";
    this.blocked = details.blocked;
    this.score = details.score;
    this.baseline = details.baseline;
    this.reason = details.reason;
  }
}

export async function withEvaluationGate(
  promptId: string,
  candidateVersion: number,
  targetEnvironment: string,
) {
  const result = await regressionGateService.checkPromotionGate(
    promptId,
    candidateVersion,
    targetEnvironment,
  );

  if (!result.allowed) {
    throw new EvaluationGateBlockedError({
      blocked: true,
      score: result.score,
      baseline: result.baseline,
      reason: result.reason ?? "Regression gate blocked promotion",
    });
  }

  return result;
}
