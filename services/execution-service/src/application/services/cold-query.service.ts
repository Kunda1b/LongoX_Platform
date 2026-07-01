import { eq, and, gte, lte, desc } from "drizzle-orm";
import { db, executionsTable } from "@longox/db";
import { RetentionPolicyService } from "./retention-policy.service";

export class ColdQueryService {
  private policyService: RetentionPolicyService;

  constructor(policyService?: RetentionPolicyService) {
    this.policyService = policyService ?? new RetentionPolicyService();
  }

  async queryExecution(
    id: number,
    tenantId: number,
  ): Promise<typeof executionsTable.$inferSelect | null> {
    const [execution] = await db
      .select()
      .from(executionsTable)
      .where(
        and(
          eq(executionsTable.id, id),
          eq(executionsTable.tenantId, tenantId),
        ),
      )
      .limit(1);

    if (execution) {
      return execution;
    }

    const policy = await this.policyService.getPolicy(tenantId);
    if (!policy.coldQueryEnabled) {
      return null;
    }

    return this.queryColdStorage(id, tenantId);
  }

  async queryByDateRange(
    tenantId: number,
    from: Date,
    to: Date,
  ): Promise<(typeof executionsTable.$inferSelect)[]> {
    const hotResults = await db
      .select()
      .from(executionsTable)
      .where(
        and(
          eq(executionsTable.tenantId, tenantId),
          gte(executionsTable.startedAt, from),
          lte(executionsTable.startedAt, to),
        ),
      )
      .orderBy(desc(executionsTable.startedAt));

    const policy = await this.policyService.getPolicy(tenantId);
    if (!policy.coldQueryEnabled) {
      return hotResults;
    }

    const coldResults = await this.queryColdStorageByRange(tenantId, from, to);
    return [...hotResults, ...coldResults];
  }

  async restoreFromCold(
    executionId: number,
    tenantId: number,
  ): Promise<typeof executionsTable.$inferSelect | null> {
    const policy = await this.policyService.getPolicy(tenantId);
    if (!policy.coldQueryEnabled) {
      return null;
    }

    const coldData = await this.queryColdStorage(executionId, tenantId);
    if (!coldData) {
      return null;
    }

    const [restored] = await db
      .insert(executionsTable)
      .values(coldData as any)
      .returning();

    return restored;
  }

  async getColdQueryPresignedUrl(
    exportId: number,
  ): Promise<string | null> {
    return `https://placeholder-storage.example.com/exports/${exportId}`;
  }

  private async queryColdStorage(
    id: number,
    tenantId: number,
  ): Promise<typeof executionsTable.$inferSelect | null> {
    return null;
  }

  private async queryColdStorageByRange(
    tenantId: number,
    from: Date,
    to: Date,
  ): Promise<(typeof executionsTable.$inferSelect)[]> {
    return [];
  }
}
