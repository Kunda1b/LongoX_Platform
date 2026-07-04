/**
 * Entitlement service.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.billingAccount`, `prisma.billingPlan`, `prisma.meteringEvent`,
 * `prisma.workflow`, `prisma.dashboard`, `prisma.membership` delegates with
 * `as any` casts for legacy columns.
 *
 * Aggregation queries that involve `sum(quantity::numeric)` on the
 * `metering_events` table use `prisma.$queryRawUnsafe()` because Prisma's
 * groupBy cannot natively express the numeric-to-string cast.
 */

import { prisma } from "@longox/db/prisma";

export class PlanLimitExceeded extends Error {
  constructor(
    public resource: string,
    public limit: number,
    public current: number,
  ) {
    super(`Plan limit exceeded for ${resource}: ${current}/${limit}`);
    this.name = "PlanLimitExceeded";
  }
}

export interface PlanLimits {
  maxWorkflows: number;
  maxEnvironments: number;
  maxConnectors: number;
  maxAiTokens: number;
  maxRagQueries: number;
  maxDashboards: number;
  maxMembers: number;
  retentionDays: number;
  auditRetentionDays: number;
}

export interface UsageAgainstPlan {
  workflows: { current: number; limit: number };
  environments: { current: number; limit: number };
  connectors: { current: number; limit: number };
  aiTokens: { current: number; limit: number };
  ragQueries: { current: number; limit: number };
  dashboards: { current: number; limit: number };
  members: { current: number; limit: number };
}

export class EntitlementService {
  async getPlan(tenantId: string): Promise<PlanLimits | null> {
    const account = await prisma.billingAccount.findFirst({
      where: { tenantId } as any,
    });

    if (!(account as any)?.planId) {
      return this.getDefaultFreeLimits();
    }

    const plan = await prisma.billingPlan.findUnique({
      where: { id: (account as any).planId },
    });

    if (!plan) {
      return this.getDefaultFreeLimits();
    }

    return {
      maxWorkflows: plan.includedWorkflows,
      maxEnvironments: plan.maxEnvironments,
      maxConnectors: plan.includedConnectors,
      maxAiTokens: plan.includedAiTokens,
      maxRagQueries: 1000,
      maxDashboards: 10,
      maxMembers: plan.maxUsers,
      retentionDays: plan.tier === "enterprise" ? 365 : 90,
      auditRetentionDays: plan.tier === "enterprise" ? 365 : 90,
    };
  }

  async getUsageAgainstPlan(tenantId: string): Promise<UsageAgainstPlan> {
    const workflowCount = await prisma.workflow.count({
      where: { tenantId } as any,
    });

    // `environments` table — count via raw SQL because the legacy Prisma
    // schema does not yet expose an Environment model that supports the
    // global count semantics expected here.
    const envRows: any[] = await prisma.$queryRawUnsafe(
      `SELECT count(*)::int AS count FROM environments`,
    );
    const envCount = Number(envRows?.[0]?.count ?? 0);

    const connectorCount = await prisma.tenantConnectorInstall.count({
      where: { tenantId } as any,
    });

    const dashboardCount = await prisma.dashboard.count({
      where: { tenantId } as any,
    });

    const memberCount = await prisma.membership.count({
      where: { tenantId } as any,
    });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const aiTokenRows: any[] = await prisma.$queryRawUnsafe(
      `SELECT coalesce(sum(quantity), '0')::text AS total
       FROM metering_events
       WHERE tenant_id = $1 AND event_type = 'ai.token' AND timestamp >= $2`,
      tenantId,
      monthStart,
    );
    const aiTokenTotal = aiTokenRows?.[0]?.total ?? "0";

    const ragRows: any[] = await prisma.$queryRawUnsafe(
      `SELECT coalesce(sum(quantity), '0')::text AS total
       FROM metering_events
       WHERE tenant_id = $1 AND event_type = 'rag.query' AND timestamp >= $2`,
      tenantId,
      monthStart,
    );
    const ragTotal = ragRows?.[0]?.total ?? "0";

    const plan = await this.getPlan(tenantId);
    const limits = plan ?? this.getDefaultFreeLimits();

    return {
      workflows: { current: workflowCount, limit: limits.maxWorkflows },
      environments: { current: envCount, limit: limits.maxEnvironments },
      connectors: { current: connectorCount, limit: limits.maxConnectors },
      aiTokens: { current: Number(aiTokenTotal), limit: limits.maxAiTokens },
      ragQueries: { current: Number(ragTotal), limit: limits.maxRagQueries },
      dashboards: { current: dashboardCount, limit: limits.maxDashboards },
      members: { current: memberCount, limit: limits.maxMembers },
    };
  }

  async checkLimit(
    tenantId: string,
    resource: string,
    quantity: number,
  ): Promise<boolean> {
    const usage = await this.getUsageAgainstPlan(tenantId);

    const limitMap: Record<string, { current: number; limit: number }> = {
      workflows: usage.workflows,
      environments: usage.environments,
      connectors: usage.connectors,
      ai_tokens: usage.aiTokens,
      rag_queries: usage.ragQueries,
      dashboards: usage.dashboards,
      members: usage.members,
    };

    const entry = limitMap[resource];
    if (!entry) return true;

    return entry.current + quantity <= entry.limit;
  }

  async enforce(tenantId: string, resource: string): Promise<void> {
    const usage = await this.getUsageAgainstPlan(tenantId);

    const limitMap: Record<string, { current: number; limit: number }> = {
      workflows: usage.workflows,
      environments: usage.environments,
      connectors: usage.connectors,
      ai_tokens: usage.aiTokens,
      rag_queries: usage.ragQueries,
      dashboards: usage.dashboards,
      members: usage.members,
    };

    const entry = limitMap[resource];
    if (!entry) return;

    if (entry.current >= entry.limit) {
      throw new PlanLimitExceeded(resource, entry.limit, entry.current);
    }
  }

  private getDefaultFreeLimits(): PlanLimits {
    return {
      maxWorkflows: 5,
      maxEnvironments: 1,
      maxConnectors: 3,
      maxAiTokens: 10000,
      maxRagQueries: 1000,
      maxDashboards: 10,
      maxMembers: 1,
      retentionDays: 90,
      auditRetentionDays: 90,
    };
  }
}
