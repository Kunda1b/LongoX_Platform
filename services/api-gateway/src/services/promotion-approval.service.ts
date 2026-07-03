import { eq, and, desc, sql } from "drizzle-orm";
import {
  db,
  workflowPromotionsTable,
  environmentReleasesTable,
  workflowVersionsTable,
  workflowsTable,
  environmentsTable,
  auditLogTable,
} from "@longox/db";

interface RequestPromotionInput {
  workflowId: number;
  fromEnvironment: string;
  toEnvironment: string;
  notes?: string;
  approvalRequired?: boolean;
  promotedBy?: string;
}

interface DiffReview {
  fromVersion: {
    version: number;
    nodeCount: number;
  } | null;
  toVersion: {
    version: number;
    nodeCount: number;
  } | null;
  changes: {
    type: "added" | "removed" | "modified";
    description: string;
  }[];
}

function computeChecksum(nodes: unknown): string {
  const data = JSON.stringify(nodes ?? []);
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const c = data.charCodeAt(i);
    hash = (hash << 5) - hash + c;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(16, "0");
}

function computeDiff(
  fromNodes: unknown,
  toNodes: unknown,
): DiffReview {
  const fromArr = Array.isArray(fromNodes) ? (fromNodes as any[]) : [];
  const toArr = Array.isArray(toNodes) ? (toNodes as any[]) : [];

  const fromMap = new Map(fromArr.map((n: any) => [n.id ?? n.name, n]));
  const toMap = new Map(toArr.map((n: any) => [n.id ?? n.name, n]));

  const changes: DiffReview["changes"] = [];

  for (const [key, node] of fromMap) {
    if (!toMap.has(key)) {
      changes.push({
        type: "removed",
        description: `Node "${node.name ?? key}" removed`,
      });
    }
  }

  for (const [key, node] of toMap) {
    if (!fromMap.has(key)) {
      changes.push({
        type: "added",
        description: `Node "${node.name ?? key}" added`,
      });
    } else {
      const fromNode = fromMap.get(key);
      if (JSON.stringify(fromNode) !== JSON.stringify(node)) {
        changes.push({
          type: "modified",
          description: `Node "${node.name ?? key}" modified`,
        });
      }
    }
  }

  return {
    fromVersion: { version: 0, nodeCount: fromArr.length },
    toVersion: { version: 0, nodeCount: toArr.length },
    changes,
  };
}

async function writeAuditLog(
  tenantId: number | null | undefined,
  actorId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  await db.insert(auditLogTable).values({
    tenantId: tenantId ?? 0,
    actorType: "user",
    actorId,
    action,
    resourceType,
    resourceId,
    metadata,
  });
}

export class PromotionApprovalService {
  async requestPromotion(
    input: RequestPromotionInput,
  ): Promise<{
    promotion: typeof workflowPromotionsTable.$inferSelect;
    release: typeof environmentReleasesTable.$inferSelect | null;
    requiresApproval: boolean;
  }> {
    const [workflow] = await db
      .select()
      .from(workflowsTable)
      .where(eq(workflowsTable.id, input.workflowId))
      .limit(1);

    if (!workflow) throw new Error("Workflow not found");

    const [latestVersion] = await db
      .select()
      .from(workflowVersionsTable)
      .where(eq(workflowVersionsTable.workflowId, input.workflowId))
      .orderBy(desc(workflowVersionsTable.version))
      .limit(1);

    const [targetEnv] = await db
      .select()
      .from(environmentsTable)
      .where(eq(environmentsTable.name, input.toEnvironment))
      .limit(1);

    const requiresApproval = input.approvalRequired ?? false;
    const status = requiresApproval ? "pending" : "promoted";
    const promotedBy = input.promotedBy ?? "system";

    const [promotion] = await db
      .insert(workflowPromotionsTable)
      .values({
        workflowId: input.workflowId,
        workflowName: workflow.name,
        fromEnvironment: input.fromEnvironment,
        toEnvironment: input.toEnvironment,
        status,
        promotedBy,
        notes: input.notes ?? null,
      })
      .returning();

    const nodes = workflow.nodes ?? [];
    const artifactChecksum = computeChecksum(nodes);

    let diffReview: DiffReview | null = null;
    if (requiresApproval) {
      const [sourceEnv] = await db
        .select()
        .from(environmentsTable)
        .where(eq(environmentsTable.name, input.fromEnvironment))
        .limit(1);

      const [targetVersion] = sourceEnv
        ? await db
            .select()
            .from(environmentReleasesTable)
            .where(
              and(
                eq(environmentReleasesTable.environmentId, sourceEnv.id),
                eq(environmentReleasesTable.artifactId, input.workflowId),
                eq(environmentReleasesTable.status, "completed"),
              ),
            )
            .orderBy(desc(environmentReleasesTable.createdAt))
            .limit(1)
        : [];

      const sourceNodes = targetVersion?.diffReview
        ? ((targetVersion.diffReview as DiffReview)?.toVersion ?? null)
        : null;

      const fromNodes = sourceNodes ? [] : (workflow.nodes ?? []);
      diffReview = computeDiff(fromNodes, nodes);
    }

    let release: typeof environmentReleasesTable.$inferSelect | null = null;

    if (!requiresApproval) {
      await db.insert(workflowVersionsTable).values({
        workflowId: input.workflowId,
        version: (latestVersion?.version ?? 0) + 1,
        name: workflow.name,
        nodes: nodes as Record<string, unknown>[],
        changeNote: `Promoted from ${input.fromEnvironment} to ${input.toEnvironment}`,
      });

      [release] = await db
        .insert(environmentReleasesTable)
        .values({
          environmentId: targetEnv?.id,
          releaseType: "workflow",
          artifactType: "workflow",
          artifactId: input.workflowId,
          artifactChecksum,
          fromEnvironment: input.fromEnvironment,
          toEnvironment: input.toEnvironment,
          status: "completed",
          approvalRequired: false,
          deployedBy: promotedBy,
          notes: input.notes ?? null,
        })
        .returning();
    } else {
      [release] = await db
        .insert(environmentReleasesTable)
        .values({
          environmentId: targetEnv?.id,
          releaseType: "workflow",
          artifactType: "workflow",
          artifactId: input.workflowId,
          artifactChecksum,
          fromEnvironment: input.fromEnvironment,
          toEnvironment: input.toEnvironment,
          status: "pending",
          approvalRequired: true,
          diffReview: diffReview as Record<string, unknown> | null,
          deployedBy: promotedBy,
          notes: input.notes ?? null,
        })
        .returning();
    }

    await writeAuditLog(
      workflow.tenantId,
      promotedBy,
      "environment.promotion.requested",
      "environment_promotion",
      String(promotion.id),
      {
        workflowId: input.workflowId,
        fromEnvironment: input.fromEnvironment,
        toEnvironment: input.toEnvironment,
        requiresApproval,
      },
    );

    return { promotion, release, requiresApproval };
  }

  async approvePromotion(
    promotionId: number,
    approvedBy: string,
    note?: string,
  ): Promise<{
    promotion: typeof workflowPromotionsTable.$inferSelect;
    release: typeof environmentReleasesTable.$inferSelect;
  }> {
    const [promotion] = await db
      .select()
      .from(workflowPromotionsTable)
      .where(eq(workflowPromotionsTable.id, promotionId))
      .limit(1);

    if (!promotion) throw new Error("Promotion not found");
    if (promotion.status !== "pending")
      throw new Error("Promotion is not in pending status");

    const [workflow] = await db
      .select()
      .from(workflowsTable)
      .where(eq(workflowsTable.id, promotion.workflowId))
      .limit(1);

    if (!workflow) throw new Error("Workflow not found");

    const [latestVersion] = await db
      .select()
      .from(workflowVersionsTable)
      .where(eq(workflowVersionsTable.workflowId, promotion.workflowId))
      .orderBy(desc(workflowVersionsTable.version))
      .limit(1);

    const [targetEnv] = await db
      .select()
      .from(environmentsTable)
      .where(eq(environmentsTable.name, promotion.toEnvironment))
      .limit(1);

    const now = new Date();
    const nodes = workflow.nodes ?? [];
    const artifactChecksum = computeChecksum(nodes);

    await db
      .update(workflowPromotionsTable)
      .set({
        status: "approved",
        approvedBy,
        approvedAt: now,
      })
      .where(eq(workflowPromotionsTable.id, promotionId));

    await db.insert(workflowVersionsTable).values({
      workflowId: promotion.workflowId,
      version: (latestVersion?.version ?? 0) + 1,
      name: workflow.name,
      nodes: nodes as Record<string, unknown>[],
      changeNote: note ?? `Promoted from ${promotion.fromEnvironment} to ${promotion.toEnvironment}`,
    });

    const [release] = await db
      .insert(environmentReleasesTable)
      .values({
        environmentId: targetEnv?.id,
        releaseType: "workflow",
        artifactType: "workflow",
        artifactId: promotion.workflowId,
        artifactChecksum,
        fromEnvironment: promotion.fromEnvironment,
        toEnvironment: promotion.toEnvironment,
        status: "completed",
        approvalRequired: true,
        approvedBy,
        approvedAt: now,
        deployedBy: approvedBy,
        notes: note ?? null,
      })
      .returning();

    const [updatedPromotion] = await db
      .select()
      .from(workflowPromotionsTable)
      .where(eq(workflowPromotionsTable.id, promotionId))
      .limit(1);

    await writeAuditLog(
      workflow.tenantId,
      approvedBy,
      "environment.promotion.approved",
      "environment_promotion",
      String(promotionId),
      {
        workflowId: promotion.workflowId,
        fromEnvironment: promotion.fromEnvironment,
        toEnvironment: promotion.toEnvironment,
      },
    );

    return { promotion: updatedPromotion!, release };
  }

  async rejectPromotion(
    promotionId: number,
    reason: string,
    rejectedBy: string,
  ): Promise<{
    promotion: typeof workflowPromotionsTable.$inferSelect;
    release: typeof environmentReleasesTable.$inferSelect;
  }> {
    const [promotion] = await db
      .select()
      .from(workflowPromotionsTable)
      .where(eq(workflowPromotionsTable.id, promotionId))
      .limit(1);

    if (!promotion) throw new Error("Promotion not found");
    if (promotion.status !== "pending")
      throw new Error("Promotion is not in pending status");

    const [workflow] = await db
      .select()
      .from(workflowsTable)
      .where(eq(workflowsTable.id, promotion.workflowId))
      .limit(1);

    const now = new Date();

    await db
      .update(workflowPromotionsTable)
      .set({
        status: "rejected",
        approvedBy: rejectedBy,
        rejectionReason: reason,
        rejectedAt: now,
      })
      .where(eq(workflowPromotionsTable.id, promotionId));

    const [targetEnv] = await db
      .select()
      .from(environmentsTable)
      .where(eq(environmentsTable.name, promotion.toEnvironment))
      .limit(1);

    const [release] = await db
      .insert(environmentReleasesTable)
      .values({
        environmentId: targetEnv?.id,
        releaseType: "workflow",
        artifactType: "workflow",
        artifactId: promotion.workflowId,
        fromEnvironment: promotion.fromEnvironment,
        toEnvironment: promotion.toEnvironment,
        status: "rejected",
        approvalRequired: true,
        approvedBy: rejectedBy,
        deployedBy: rejectedBy,
        notes: reason,
      })
      .returning();

    const [updatedPromotion] = await db
      .select()
      .from(workflowPromotionsTable)
      .where(eq(workflowPromotionsTable.id, promotionId))
      .limit(1);

    await writeAuditLog(
      workflow?.tenantId ?? null,
      rejectedBy,
      "environment.promotion.rejected",
      "environment_promotion",
      String(promotionId),
      {
        workflowId: promotion.workflowId,
        reason,
      },
    );

    return { promotion: updatedPromotion!, release };
  }

  async rollbackPromotion(
    promotionId: number,
    rolledBackBy: string,
  ): Promise<{
    promotion: typeof workflowPromotionsTable.$inferSelect;
    release: typeof environmentReleasesTable.$inferSelect;
  }> {
    const [promotion] = await db
      .select()
      .from(workflowPromotionsTable)
      .where(eq(workflowPromotionsTable.id, promotionId))
      .limit(1);

    if (!promotion) throw new Error("Promotion not found");

    const [workflow] = await db
      .select()
      .from(workflowsTable)
      .where(eq(workflowsTable.id, promotion.workflowId))
      .limit(1);

    const now = new Date();

    await db
      .update(workflowPromotionsTable)
      .set({ status: "rolled_back" })
      .where(eq(workflowPromotionsTable.id, promotionId));

    const [targetEnv] = await db
      .select()
      .from(environmentsTable)
      .where(eq(environmentsTable.name, promotion.toEnvironment))
      .limit(1);

    const [release] = await db
      .insert(environmentReleasesTable)
      .values({
        environmentId: targetEnv?.id,
        releaseType: "workflow",
        artifactType: "workflow",
        artifactId: promotion.workflowId,
        fromEnvironment: promotion.fromEnvironment,
        toEnvironment: promotion.toEnvironment,
        status: "rolled_back",
        rollbackOf: promotionId,
        deployedBy: rolledBackBy,
      })
      .returning();

    const [updatedPromotion] = await db
      .select()
      .from(workflowPromotionsTable)
      .where(eq(workflowPromotionsTable.id, promotionId))
      .limit(1);

    await writeAuditLog(
      workflow?.tenantId ?? null,
      rolledBackBy,
      "environment.promotion.rolled_back",
      "environment_promotion",
      String(promotionId),
      {
        workflowId: promotion.workflowId,
        fromEnvironment: promotion.fromEnvironment,
        toEnvironment: promotion.toEnvironment,
      },
    );

    return { promotion: updatedPromotion!, release };
  }
}

export const promotionApprovalService = new PromotionApprovalService();
