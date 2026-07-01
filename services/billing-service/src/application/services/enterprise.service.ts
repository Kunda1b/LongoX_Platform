import {
  db,
  enterpriseCommitmentsTable,
  billingAccountsTable,
  billingPlansTable,
  overageEventsTable,
} from "@longox/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export interface EnterpriseCommitment {
  id: number;
  name: string;
  commitmentType: string;
  annualAmount: string;
  includedExecutions: number;
  includedAiTokens: number;
  includedRagQueries: number;
  includedStorageGb: number;
  maxWorkflows: number | null;
  maxMembers: number | null;
  maxConnectors: number | null;
  maxDashboards: number | null;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

export interface CommitmentOverage {
  resource: string;
  committed: number;
  used: number;
  overage: number;
}

export class EnterpriseService {
  async getCommitment(tenantId: number): Promise<EnterpriseCommitment | null> {
    const [commitment] = await db
      .select()
      .from(enterpriseCommitmentsTable)
      .where(
        and(
          eq(enterpriseCommitmentsTable.tenantId, tenantId),
          eq(enterpriseCommitmentsTable.isActive, true),
        ),
      )
      .limit(1);

    if (!commitment) return null;

    return {
      id: commitment.id,
      name: commitment.name,
      commitmentType: commitment.commitmentType,
      annualAmount: commitment.annualAmount,
      includedExecutions: commitment.includedExecutions,
      includedAiTokens: commitment.includedAiTokens,
      includedRagQueries: commitment.includedRagQueries,
      includedStorageGb: commitment.includedStorageGb,
      maxWorkflows: commitment.maxWorkflows,
      maxMembers: commitment.maxMembers,
      maxConnectors: commitment.maxConnectors,
      maxDashboards: commitment.maxDashboards,
      startDate: commitment.startDate,
      endDate: commitment.endDate,
      isActive: commitment.isActive,
    };
  }

  async trackCommitmentUsage(
    tenantId: number,
    usage: { resource: string; quantity: number },
  ): Promise<void> {
    const commitment = await this.getCommitment(tenantId);
    if (!commitment) return;

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), 0, 1);
    const periodEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    const [existing] = await db
      .select()
      .from(overageEventsTable)
      .where(
        and(
          eq(overageEventsTable.tenantId, tenantId),
          eq(overageEventsTable.resource, usage.resource),
          gte(overageEventsTable.periodStart, periodStart),
          lte(overageEventsTable.periodEnd, periodEnd),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .update(overageEventsTable)
        .set({
          overageQuantity: String(
            Number(existing.overageQuantity) + usage.quantity,
          ),
        })
        .where(eq(overageEventsTable.id, existing.id));
    } else {
      await db.insert(overageEventsTable).values({
        tenantId,
        resource: usage.resource,
        overageQuantity: String(usage.quantity),
        rate: "0",
        amount: "0",
        periodStart,
        periodEnd,
        metadata: { commitmentTracked: true },
      });
    }
  }

  async checkCommitment(
    tenantId: number,
    resource: string,
    quantity: number,
  ): Promise<boolean> {
    const commitment = await this.getCommitment(tenantId);
    if (!commitment) return false;

    const usage = await this.getUsageByResource(tenantId, resource);
    const limit = this.getCommitmentLimit(commitment, resource);

    return usage + quantity <= limit;
  }

  async getCommitmentOverage(tenantId: number): Promise<CommitmentOverage[]> {
    const commitment = await this.getCommitment(tenantId);
    if (!commitment) return [];

    const resources = [
      "executions",
      "ai_tokens",
      "rag_queries",
      "storage_gb",
    ];

    const result: CommitmentOverage[] = [];

    for (const resource of resources) {
      const usage = await this.getUsageByResource(tenantId, resource);
      const limit = this.getCommitmentLimit(commitment, resource);

      result.push({
        resource,
        committed: limit,
        used: usage,
        overage: Math.max(0, usage - limit),
      });
    }

    return result;
  }

  private async getUsageByResource(
    tenantId: number,
    resource: string,
  ): Promise<number> {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    const [row] = await db
      .select({
        total: sql<string>`coalesce(sum(${overageEventsTable.overageQuantity}::numeric), '0')`,
      })
      .from(overageEventsTable)
      .where(
        and(
          eq(overageEventsTable.tenantId, tenantId),
          eq(overageEventsTable.resource, resource),
          gte(overageEventsTable.periodStart, yearStart),
          lte(overageEventsTable.periodEnd, yearEnd),
        ),
      );

    return Number(row?.total ?? "0");
  }

  private getCommitmentLimit(
    commitment: EnterpriseCommitment,
    resource: string,
  ): number {
    switch (resource) {
      case "executions":
        return commitment.includedExecutions;
      case "ai_tokens":
        return commitment.includedAiTokens;
      case "rag_queries":
        return commitment.includedRagQueries;
      case "storage_gb":
        return commitment.includedStorageGb;
      default:
        return 0;
    }
  }
}
