import { eq, and, sql } from "drizzle-orm";
import { db } from "@longox/db";
import {
  aiEvaluationDatasetsTable,
  aiEvaluationDatasetEntriesTable,
} from "@longox/db";

export interface CreateDatasetInput {
  name: string;
  description?: string;
  tenantId: number;
  promptId?: number;
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
    const [dataset] = await db
      .insert(aiEvaluationDatasetsTable)
      .values({
        name: input.name,
        description: input.description ?? null,
        tenantId: input.tenantId,
        promptId: input.promptId ?? null,
        metadata: (input.metadata ?? {}) as Record<string, unknown>,
        status: "draft",
        entryCount: 0,
      })
      .returning();
    return dataset;
  }

  async listDatasets(tenantId: number) {
    return db
      .select()
      .from(aiEvaluationDatasetsTable)
      .where(eq(aiEvaluationDatasetsTable.tenantId, tenantId))
      .orderBy(aiEvaluationDatasetsTable.updatedAt);
  }

  async getDataset(id: number) {
    const [dataset] = await db
      .select()
      .from(aiEvaluationDatasetsTable)
      .where(eq(aiEvaluationDatasetsTable.id, id));
    if (!dataset) return null;

    const entries = await db
      .select()
      .from(aiEvaluationDatasetEntriesTable)
      .where(eq(aiEvaluationDatasetEntriesTable.datasetId, id))
      .orderBy(aiEvaluationDatasetEntriesTable.id);

    return { ...dataset, entries };
  }

  async addEntries(datasetId: number, entries: AddEntryInput[]) {
    const values = entries.map((e) => ({
      datasetId,
      input: e.input,
      expectedOutput: e.expectedOutput ?? null,
      context: (e.context ?? {}) as Record<string, unknown>,
      metadata: (e.metadata ?? {}) as Record<string, unknown>,
    }));

    const inserted = await db
      .insert(aiEvaluationDatasetEntriesTable)
      .values(values)
      .returning();

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(aiEvaluationDatasetEntriesTable)
      .where(eq(aiEvaluationDatasetEntriesTable.datasetId, datasetId));

    await db
      .update(aiEvaluationDatasetsTable)
      .set({ entryCount: count })
      .where(eq(aiEvaluationDatasetsTable.id, datasetId));

    return inserted;
  }

  async removeEntry(datasetId: number, entryId: number) {
    const [deleted] = await db
      .delete(aiEvaluationDatasetEntriesTable)
      .where(
        and(
          eq(aiEvaluationDatasetEntriesTable.id, entryId),
          eq(aiEvaluationDatasetEntriesTable.datasetId, datasetId),
        ),
      )
      .returning();

    if (deleted) {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(aiEvaluationDatasetEntriesTable)
        .where(eq(aiEvaluationDatasetEntriesTable.datasetId, datasetId));

      await db
        .update(aiEvaluationDatasetsTable)
        .set({ entryCount: count })
        .where(eq(aiEvaluationDatasetsTable.id, datasetId));
    }

    return deleted;
  }

  async deleteDataset(id: number) {
    const [dataset] = await db
      .update(aiEvaluationDatasetsTable)
      .set({ status: "archived" })
      .where(eq(aiEvaluationDatasetsTable.id, id))
      .returning();
    return dataset;
  }
}

export const evaluationDatasetService = new EvaluationDatasetService();
