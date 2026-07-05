/**
 * Enterprise commitment service.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.enterpriseCommitment`, `prisma.billingAccount`,
 * `prisma.billingPlan`, `prisma.overageEvent` delegates with `as any` casts
 * for legacy columns.
 *
 * Raw sums on `overage_events.overage_quantity` use `prisma.$queryRawUnsafe()`
 * because of the `sum(numeric)::text` casts.
 */

import { prisma } from "@longox/db/prisma";

export interface EnterpriseCommitment {
  id: string;
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
  async getCommitment(tenantId: string): Promise<EnterpriseCommitment | null> {
    const commitment = await prisma.enterpriseCommitment.findFirst({
      where: {
        tenantId,
        isActive: true,
      } as any,
    });

    if (!commitment) return null;
    const c = commitment as any;

    return {
      id: c.id,
      name: c.name,
      commitmentType: c.commitmentType,
      annualAmount: String(c.annualAmount),
      includedExecutions: c.includedExecutions,
      includedAiTokens: c.includedAiTokens,
      includedRagQueries: c.includedRagQueries,
      includedStorageGb: c.includedStorageGb,
      maxWorkflows: c.maxWorkflows,
      maxMembers: c.maxMembers,
      maxConnectors: c.maxConnectors,
      maxDashboards: c.maxDashboards,
      startDate: c.startDate,
      endDate: c.endDate,
      isActive: c.isActive,
    };
  }

  async trackCommitmentUsage(
    tenantId: string,
    usage: { resource: string; quantity: number },
  ): Promise<void> {
    const commitment = await this.getCommitment(tenantId);
    if (!commitment) return;

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), 0, 1);
    const periodEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    const existing = await prisma.overageEvent.findFirst({
      where: {
        tenantId,
        resource: usage.resource,
        periodStart: { gte: periodStart },
        periodEnd: { lte: periodEnd },
      } as any,
    });

    if (existing) {
      const e = existing as any;
      await prisma.overageEvent.update({
        where: { id: e.id },
        data: {
          overageQuantity: Number(e.overageQuantity) + usage.quantity,
        } as any,
      });
    } else {
      await prisma.overageEvent.create({
        data: {
          tenantId,
          resource: usage.resource,
          overageQuantity: usage.quantity,
          rate: 0,
          amount: 0,
          periodStart,
          periodEnd,
          metadata: { commitmentTracked: true },
        } as any,
      });
    }
  }

  async checkCommitment(
    tenantId: string,
    resource: string,
    quantity: number,
  ): Promise<boolean> {
    const commitment = await this.getCommitment(tenantId);
    if (!commitment) return false;

    const usage = await this.getUsageByResource(tenantId, resource);
    const limit = this.getCommitmentLimit(commitment, resource);

    return usage + quantity <= limit;
  }

  async getCommitmentOverage(tenantId: string): Promise<CommitmentOverage[]> {
    const commitment = await this.getCommitment(tenantId);
    if (!commitment) return [];

    const resources = ["executions", "ai_tokens", "rag_queries", "storage_gb"];

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
    tenantId: string,
    resource: string,
  ): Promise<number> {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT coalesce(sum(overage_quantity::numeric), '0')::text AS total
       FROM overage_events
       WHERE tenant_id = $1
         AND resource = $2
         AND period_start >= $3
         AND period_end <= $4`,
      tenantId,
      resource,
      yearStart,
      yearEnd,
    );

    return Number(rows?.[0]?.total ?? "0");
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
