import {
  db,
  billingAccountsTable,
  billingPlansTable,
  meteringEventsTable,
  workflowsTable,
  dashboardsTable,
  membershipsTable,
} from "@longox/db";
import { eq, and, gte, sql } from "drizzle-orm";

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
    const [account] = await db
      .select()
      .from(billingAccountsTable)
      .where(eq(billingAccountsTable.tenantId, tenantId))
      .limit(1);

    if (!account?.planId) {
      return this.getDefaultFreeLimits();
    }

    const [plan] = await db
      .select()
      .from(billingPlansTable)
      .where(eq(billingPlansTable.id, account.planId))
      .limit(1);

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
    const [workflowCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(workflowsTable)
      .where(eq(workflowsTable.tenantId, tenantId));

    const [envCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(sql`environments`);

    const [connectorCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(sql`tenant_connector_installs`)
      .where(eq(sql`tenant_connector_installs.tenant_id`, tenantId));

    const [dashboardCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(dashboardsTable)
      .where(eq(dashboardsTable.tenantId, tenantId));

    const [memberCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(membershipsTable)
      .where(eq(membershipsTable.tenantId, tenantId));

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [aiTokenResult] = await db
      .select({ total: sql<string>`coalesce(sum(${meteringEventsTable.quantity}), '0')` })
      .from(meteringEventsTable)
      .where(
        and(
          eq(meteringEventsTable.tenantId, tenantId),
          eq(meteringEventsTable.eventType, "ai.token"),
          gte(meteringEventsTable.timestamp, monthStart),
        ),
      );

    const [ragResult] = await db
      .select({ total: sql<string>`coalesce(sum(${meteringEventsTable.quantity}), '0')` })
      .from(meteringEventsTable)
      .where(
        and(
          eq(meteringEventsTable.tenantId, tenantId),
          eq(meteringEventsTable.eventType, "rag.query"),
          gte(meteringEventsTable.timestamp, monthStart),
        ),
      );

    const plan = await this.getPlan(tenantId);
    const limits = plan ?? this.getDefaultFreeLimits();

    return {
      workflows: { current: workflowCount?.count ?? 0, limit: limits.maxWorkflows },
      environments: { current: envCount?.count ?? 0, limit: limits.maxEnvironments },
      connectors: { current: connectorCount?.count ?? 0, limit: limits.maxConnectors },
      aiTokens: { current: Number(aiTokenResult?.total ?? "0"), limit: limits.maxAiTokens },
      ragQueries: { current: Number(ragResult?.total ?? "0"), limit: limits.maxRagQueries },
      dashboards: { current: dashboardCount?.count ?? 0, limit: limits.maxDashboards },
      members: { current: memberCount?.count ?? 0, limit: limits.maxMembers },
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
