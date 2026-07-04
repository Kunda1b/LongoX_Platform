import { db, promptsTable, promptVersionsTable } from "@longox/db";
import { eq, and, desc } from "drizzle-orm";
import { EvaluationGateService } from "./evaluation-gate.service";

export interface VersionDiff {
  field: string;
  from: unknown;
  to: unknown;
}

export interface CreateVersionInput {
  promptId: string;
  content: string;
  config?: Record<string, unknown>;
  createdBy?: string;
  changeNote?: string;
}

export class PromptVersioningService {
  private evaluationGate = new EvaluationGateService();

  async createVersion(input: CreateVersionInput): Promise<typeof promptVersionsTable.$inferSelect> {
    const [currentPrompt] = await db
      .select()
      .from(promptsTable)
      .where(eq(promptsTable.id, input.promptId));

    if (!currentPrompt) {
      throw new Error(`Prompt ${input.promptId} not found`);
    }

    const newVersion = currentPrompt.version + 1;

    const [row] = await db
      .insert(promptVersionsTable)
      .values({
        promptId: input.promptId,
        content: input.content,
        version: newVersion,
        status: "draft",
        notes: input.changeNote ?? null,
      })
      .returning();

    return row;
  }

  async promoteVersion(
    promptId: string,
    fromVersion: number,
    toEnvironment: string,
  ): Promise<{ success: boolean; gateResult?: Awaited<ReturnType<EvaluationGateService["checkRegression"]>> }> {
    const [versionRow] = await db
      .select()
      .from(promptVersionsTable)
      .where(
        and(
          eq(promptVersionsTable.promptId, promptId),
          eq(promptVersionsTable.version, fromVersion),
        ),
      );

    if (!versionRow) {
      throw new Error(`Version ${fromVersion} of prompt ${promptId} not found`);
    }

    const gateResult = await this.evaluationGate.checkRegression(
      promptId,
      fromVersion,
      fromVersion - 1,
    );

    if (!gateResult.passed) {
      await db
        .update(promptVersionsTable)
        .set({ status: "deprecated" })
        .where(
          and(
            eq(promptVersionsTable.promptId, promptId),
            eq(promptVersionsTable.version, fromVersion),
          ),
        );

      return { success: false, gateResult };
    }

    await db
      .update(promptVersionsTable)
      .set({ status: toEnvironment === "production" ? "promoted" : "active" })
      .where(
        and(
          eq(promptVersionsTable.promptId, promptId),
          eq(promptVersionsTable.version, fromVersion),
        ),
      );

    await db
      .update(promptsTable)
      .set({
        content: versionRow.content,
        version: fromVersion,
        status: "approved",
      })
      .where(eq(promptsTable.id, promptId));

    return { success: true, gateResult };
  }

  async diffVersions(
    v1: number,
    v2: number,
    promptId?: string,
  ): Promise<VersionDiff[]> {
    const conditions1 = [eq(promptVersionsTable.version, v1)];
    const conditions2 = [eq(promptVersionsTable.version, v2)];
    if (promptId) {
      conditions1.push(eq(promptVersionsTable.promptId, promptId));
      conditions2.push(eq(promptVersionsTable.promptId, promptId));
    }

    const [version1] = await db
      .select()
      .from(promptVersionsTable)
      .where(and(...conditions1));

    const [version2] = await db
      .select()
      .from(promptVersionsTable)
      .where(and(...conditions2));

    if (!version1 || !version2) {
      throw new Error(`One or both versions not found (v${v1}, v${v2})`);
    }

    const diffs: VersionDiff[] = [];

    if (version1.content !== version2.content) {
      diffs.push({ field: "content", from: version1.content, to: version2.content });
    }
    if (version1.status !== version2.status) {
      diffs.push({ field: "status", from: version1.status, to: version2.status });
    }
    if (version1.notes !== version2.notes) {
      diffs.push({ field: "notes", from: version1.notes, to: version2.notes });
    }

    return diffs;
  }
}

export const promptVersioningService = new PromptVersioningService();
