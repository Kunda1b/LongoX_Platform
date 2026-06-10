export interface EvaluationResult {
  score: number;
  metrics: {
    relevance: number;
    accuracy: number;
    completeness: number;
    coherence: number;
  };
  feedback: string[];
}

export class EvaluationService {
  evaluate(
    output: string,
    expected?: string,
  ): EvaluationResult {
    const metrics = {
      relevance: this.evaluateRelevance(output, expected),
      accuracy: this.evaluateAccuracy(output, expected),
      completeness: this.evaluateCompleteness(output, expected),
      coherence: this.evaluateCoherence(output),
    };

    const score = Object.values(metrics).reduce((a, b) => a + b, 0) / 4;

    const feedback: string[] = [];

    if (metrics.relevance < 0.5) {
      feedback.push("Output has low relevance to the expected result");
    }
    if (metrics.accuracy < 0.5) {
      feedback.push("Output accuracy needs improvement");
    }
    if (metrics.completeness < 0.5) {
      feedback.push("Output is incomplete");
    }
    if (metrics.coherence < 0.5) {
      feedback.push("Output lacks coherence");
    }

    return { score, metrics, feedback };
  }

  private evaluateRelevance(output: string, expected?: string): number {
    if (!expected) return 1;
    const outputWords = new Set(output.toLowerCase().split(/\s+/));
    const expectedWords = new Set(expected.toLowerCase().split(/\s+/));

    let overlap = 0;
    for (const word of outputWords) {
      if (expectedWords.has(word)) overlap++;
    }

    return expectedWords.size > 0 ? overlap / expectedWords.size : 1;
  }

  private evaluateAccuracy(output: string, expected?: string): number {
    if (!expected) return 1;
    const outputNorm = output.toLowerCase().trim();
    const expectedNorm = expected.toLowerCase().trim();

    if (outputNorm === expectedNorm) return 1;
    if (outputNorm.includes(expectedNorm) || expectedNorm.includes(outputNorm)) return 0.8;

    return 0.5;
  }

  private evaluateCompleteness(output: string, expected?: string): number {
    if (!expected) return 1;

    const expectedParts = expected.split("\n").filter(Boolean);
    const matchedParts = expectedParts.filter((part) =>
      output.toLowerCase().includes(part.toLowerCase()),
    );

    return expectedParts.length > 0 ? matchedParts.length / expectedParts.length : 1;
  }

  private evaluateCoherence(output: string): number {
    if (!output.trim()) return 0;

    const sentences = output.split(/[.!?]+/).filter(Boolean);
    if (sentences.length <= 1) return 0.8;

    let coherentScore = 0;
    for (let i = 1; i < sentences.length; i++) {
      const prevWords = sentences[i - 1].split(/\s+/).slice(-3);
      const currWords = sentences[i].split(/\s+/).slice(0, 3);

      const overlap = prevWords.some((w) =>
        currWords.some((cw) => cw.toLowerCase() === w.toLowerCase()),
      );

      if (overlap) coherentScore++;
    }

    return sentences.length > 1 ? coherentScore / (sentences.length - 1) : 0.8;
  }
}

export const evaluationService = new EvaluationService();
