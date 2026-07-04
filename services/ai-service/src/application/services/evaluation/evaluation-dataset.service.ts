/**
 * Evaluation dataset service.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.aiEvalDataset` and `prisma.aiEvalDatasetEntry` delegates with
 * `as any` casts for legacy columns.
 */

import { prisma } from "@longox/db/prisma";

export interface CreateDatasetInput {
  name: string;
  description?: string;
  tenantId: string;
  promptId?: string;
  metadata?: Record<string, unknown>;
}

export interface AddEntryInput {
  input: string;
  expectedOutput?: string;
  context?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export class EvaluationDatasetService {
  async createDataset(input: CreateDatasetInput) {
    const dataset = await prisma.aiEvalDataset.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        tenantId: input.tenantId,
        promptId: input.promptId ?? null,
        metadata: (input.metadata ?? {}) as Record<string, unknown>,
        status: "draft",
        entryCount: 0,
      } as any,
    });
    return dataset;
  }

  async listDatasets(tenantId: string) {
    return prisma.aiEvalDataset.findMany({
      where: { tenantId } as any,
      orderBy: { updatedAt: "desc" } as any,
    });
  }

  async getDataset(id: string) {
    const dataset = await prisma.aiEvalDataset.findUnique({
      where: { id } as any,
    });
    if (!dataset) return null;

    const entries = await prisma.aiEvalDatasetEntry.findMany({
      where: { datasetId: id } as any,
      orderBy: { id: "asc" } as any,
    });

    return { ...dataset, entries };
  }

  async addEntries(datasetId: string, entries: AddEntryInput[]) {
    const values = entries.map((e) => ({
      datasetId,
      input: e.input,
      expectedOutput: e.expectedOutput ?? null,
      context: (e.context ?? {}) as Record<string, unknown>,
      metadata: (e.metadata ?? {}) as Record<string, unknown>,
    }));

    await prisma.aiEvalDatasetEntry.createMany({
      data: values as any,
    });

    const count = await prisma.aiEvalDatasetEntry.count({
      where: { datasetId } as any,
    });

    await prisma.aiEvalDataset.update({
      where: { id: datasetId } as any,
      data: { entryCount: count } as any,
    });

    // Return the most recent entries as the "inserted" set (Prisma
    // `createMany` doesn't return rows; this preserves the original return
    // type loosely).
    return prisma.aiEvalDatasetEntry.findMany({
      where: { datasetId } as any,
      orderBy: { id: "desc" } as any,
      take: entries.length,
    });
  }

  async removeEntry(datasetId: string, entryId: string) {
    let deleted: any = null;
    try {
      deleted = await prisma.aiEvalDatasetEntry.delete({
        where: {
          id: entryId,
          datasetId,
        } as any,
      });
    } catch {
      deleted = null;
    }

    if (deleted) {
      const count = await prisma.aiEvalDatasetEntry.count({
        where: { datasetId } as any,
      });

      await prisma.aiEvalDataset.update({
        where: { id: datasetId } as any,
        data: { entryCount: count } as any,
      });
    }

    return deleted;
  }

  async deleteDataset(id: string) {
    const dataset = await prisma.aiEvalDataset.update({
      where: { id } as any,
      data: { status: "archived" } as any,
    });
    return dataset;
  }
}

export const evaluationDatasetService = new EvaluationDatasetService();
