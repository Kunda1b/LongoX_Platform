/**
 * Prompt versioning service.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.aiPrompt` and `prisma.aiPromptVersion` delegates with `as any`
 * casts for legacy columns (`content`, `version`, `status`, `notes`).
 */

import { prisma } from "@longox/db/prisma";
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

  async createVersion(input: CreateVersionInput): Promise<any> {
    const currentPrompt = await prisma.aiPrompt.findUnique({
      where: { id: input.promptId } as any,
    });

    if (!currentPrompt) {
      throw new Error(`Prompt ${input.promptId} not found`);
    }

    const newVersion = ((currentPrompt as any).version ?? 0) + 1;

    const row = await prisma.aiPromptVersion.create({
      data: {
        promptId: input.promptId,
        content: input.content,
        version: newVersion,
        status: "draft",
        notes: input.changeNote ?? null,
      } as any,
    });

    return row;
  }

  async promoteVersion(
    promptId: string,
    fromVersion: number,
    toEnvironment: string,
  ): Promise<{ success: boolean; gateResult?: Awaited<ReturnType<EvaluationGateService["checkRegression"]>> }> {
    const versionRow = await prisma.aiPromptVersion.findFirst({
      where: {
        promptId,
        version: fromVersion,
      } as any,
    });

    if (!versionRow) {
      throw new Error(`Version ${fromVersion} of prompt ${promptId} not found`);
    }

    const gateResult = await this.evaluationGate.checkRegression(
      promptId,
      fromVersion,
      fromVersion - 1,
    );

    if (!gateResult.passed) {
      await prisma.aiPromptVersion.updateMany({
        where: {
          promptId,
          version: fromVersion,
        } as any,
        data: { status: "deprecated" } as any,
      });

      return { success: false, gateResult };
    }

    await prisma.aiPromptVersion.updateMany({
      where: {
        promptId,
        version: fromVersion,
      } as any,
      data: {
        status: toEnvironment === "production" ? "promoted" : "active",
      } as any,
    });

    await prisma.aiPrompt.update({
      where: { id: promptId } as any,
      data: {
        content: (versionRow as any).content,
        version: fromVersion,
        status: "approved",
      } as any,
    });

    return { success: true, gateResult };
  }

  async diffVersions(
    v1: number,
    v2: number,
    promptId?: string,
  ): Promise<VersionDiff[]> {
    const where1: Record<string, unknown> = { version: v1 };
    const where2: Record<string, unknown> = { version: v2 };
    if (promptId) {
      where1.promptId = promptId;
      where2.promptId = promptId;
    }

    const version1 = await prisma.aiPromptVersion.findFirst({
      where: where1 as any,
    });
    const version2 = await prisma.aiPromptVersion.findFirst({
      where: where2 as any,
    });

    if (!version1 || !version2) {
      throw new Error(`One or both versions not found (v${v1}, v${v2})`);
    }

    const diffs: VersionDiff[] = [];

    if ((version1 as any).content !== (version2 as any).content) {
      diffs.push({ field: "content", from: (version1 as any).content, to: (version2 as any).content });
    }
    if ((version1 as any).status !== (version2 as any).status) {
      diffs.push({ field: "status", from: (version1 as any).status, to: (version2 as any).status });
    }
    if ((version1 as any).notes !== (version2 as any).notes) {
      diffs.push({ field: "notes", from: (version1 as any).notes, to: (version2 as any).notes });
    }

    return diffs;
  }
}

export const promptVersioningService = new PromptVersioningService();
