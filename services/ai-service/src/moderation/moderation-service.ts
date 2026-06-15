import OpenAI from "openai";

export interface ModerationResult {
  flagged: boolean;
  categories: Record<string, boolean>;
  categoryScores: Record<string, number>;
}

export class ModerationService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY ?? "",
    });
  }

  async moderate(text: string): Promise<ModerationResult> {
    try {
      const response = await this.openai.moderations.create({ input: text });

      const result = response.results[0];

      return {
        flagged: result.flagged,
        categories: result.categories as unknown as Record<string, boolean>,
        categoryScores: result.category_scores as unknown as Record<
          string,
          number
        >,
      };
    } catch {
      return {
        flagged: false,
        categories: {},
        categoryScores: {},
      };
    }
  }

  async moderateContent(
    content: string,
    thresholds: Record<string, number> = {
      hate: 0.5,
      "hate/threatening": 0.5,
      "self-harm": 0.5,
      sexual: 0.5,
      "sexual/minors": 0.3,
      violence: 0.5,
      "violence/graphic": 0.5,
    },
  ): Promise<{ passed: boolean; reasons: string[] }> {
    const result = await this.moderate(content);

    if (!result.flagged) {
      return { passed: true, reasons: [] };
    }

    const reasons: string[] = [];

    for (const [category, threshold] of Object.entries(thresholds)) {
      const score = result.categoryScores[category] ?? 0;
      if (score > threshold) {
        reasons.push(
          `${category} (score: ${score.toFixed(3)}, threshold: ${threshold})`,
        );
      }
    }

    return {
      passed: reasons.length === 0,
      reasons,
    };
  }
}

export const moderationService = new ModerationService();
