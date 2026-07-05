import { prisma } from "@longox/db/prisma";

interface RequestPromotionInput {
  workflowId: string;
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

function computeDiff(fromNodes: unknown, toNodes: unknown): DiffReview {
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
  tenantId: string | null | undefined,
  actorId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId,
      action,
      targetType: resourceType,
      targetId: resourceId,
      diffJson: {
        ...metadata,
        tenantId: tenantId ?? "",
        actorType: "user",
      } as any,
    } as any,
  });
}

export class PromotionApprovalService {
  async requestPromotion(input: RequestPromotionInput): Promise<{
    promotion: any;
    release: any | null;
    requiresApproval: boolean;
  }> {
    if (input.toEnvironment === "production") {
      try {
        const { withEvaluationGate } = await import("@longox/ai-service");
        await withEvaluationGate(input.workflowId, 0, input.toEnvironment);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "EvaluationGateBlockedError") {
          throw err;
        }
      }
    }
    const workflow = (await prisma.workflow.findUnique({
      where: { id: input.workflowId },
    })) as any;

    if (!workflow) throw new Error("Workflow not found");

    const latestVersion = (await prisma.workflowVersion.findFirst({
      where: { workflowId: input.workflowId },
      orderBy: { versionNumber: "desc" },
    })) as any;

    const targetEnv = (await prisma.environment.findFirst({
      where: { name: input.toEnvironment } as any,
    })) as any;

    const requiresApproval = input.approvalRequired ?? false;
    const status = requiresApproval ? "pending" : "promoted";
    const promotedBy = input.promotedBy ?? "system";

    const promotion = (await prisma.workflowPromotion.create({
      data: {
        workflowId: input.workflowId,
        workflowName: workflow.name,
        fromEnvironment: input.fromEnvironment,
        toEnvironment: input.toEnvironment,
        status,
        promotedBy,
        notes: input.notes ?? null,
      },
    })) as any;

    const nodes = (workflow as any).nodes ?? [];
    const artifactChecksum = computeChecksum(nodes);

    let diffReview: DiffReview | null = null;
    if (requiresApproval) {
      const sourceEnv = (await prisma.environment.findFirst({
        where: { name: input.fromEnvironment } as any,
      })) as any;

      const targetVersion = sourceEnv
        ? ((await prisma.environmentRelease.findFirst({
            where: {
              environmentId: sourceEnv.id,
              artifactType: "workflow",
              sourceVersionId: input.workflowId,
              status: "completed",
            } as any,
            orderBy: { createdAt: "desc" },
          })) as any)
        : null;

      const sourceNodes = targetVersion?.diffReview
        ? ((targetVersion.diffReview as DiffReview)?.toVersion ?? null)
        : null;

      const fromNodes = sourceNodes ? [] : ((workflow as any).nodes ?? []);
      diffReview = computeDiff(fromNodes, nodes);
    }

    let release: any = null;

    if (!requiresApproval) {
      await prisma.workflowVersion.create({
        data: {
          workflowId: input.workflowId,
          versionNumber: ((latestVersion?.versionNumber ?? 0) as number) + 1,
          name: workflow.name,
          graphJson: nodes as any,
          changeNote: `Promoted from ${input.fromEnvironment} to ${input.toEnvironment}`,
        } as any,
      });

      release = (await prisma.environmentRelease.create({
        data: {
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
        } as any,
      })) as any;
    } else {
      release = (await prisma.environmentRelease.create({
        data: {
          environmentId: targetEnv?.id,
          releaseType: "workflow",
          artifactType: "workflow",
          artifactId: input.workflowId,
          artifactChecksum,
          fromEnvironment: input.fromEnvironment,
          toEnvironment: input.toEnvironment,
          status: "pending",
          approvalRequired: true,
          diffReview: diffReview as any,
          deployedBy: promotedBy,
          notes: input.notes ?? null,
        } as any,
      })) as any;
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
    promotionId: string,
    approvedBy: string,
    note?: string,
  ): Promise<{
    promotion: any;
    release: any;
  }> {
    const promotion = (await prisma.workflowPromotion.findUnique({
      where: { id: promotionId },
    })) as any;

    if (!promotion) throw new Error("Promotion not found");
    if (promotion.status !== "pending")
      throw new Error("Promotion is not in pending status");

    const workflow = (await prisma.workflow.findUnique({
      where: { id: promotion.workflowId },
    })) as any;

    if (!workflow) throw new Error("Workflow not found");

    const latestVersion = (await prisma.workflowVersion.findFirst({
      where: { workflowId: promotion.workflowId },
      orderBy: { versionNumber: "desc" },
    })) as any;

    const targetEnv = (await prisma.environment.findFirst({
      where: { name: promotion.toEnvironment } as any,
    })) as any;

    const now = new Date();
    const nodes = (workflow as any).nodes ?? [];
    const artifactChecksum = computeChecksum(nodes);

    await prisma.workflowPromotion.update({
      where: { id: promotionId },
      data: {
        status: "approved",
        approvedBy,
        approvedAt: now,
      } as any,
    });

    await prisma.workflowVersion.create({
      data: {
        workflowId: promotion.workflowId,
        versionNumber: ((latestVersion?.versionNumber ?? 0) as number) + 1,
        name: workflow.name,
        graphJson: nodes as any,
        changeNote:
          note ??
          `Promoted from ${promotion.fromEnvironment} to ${promotion.toEnvironment}`,
      } as any,
    });

    const release = (await prisma.environmentRelease.create({
      data: {
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
      } as any,
    })) as any;

    const updatedPromotion = (await prisma.workflowPromotion.findUnique({
      where: { id: promotionId },
    })) as any;

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
    promotionId: string,
    reason: string,
    rejectedBy: string,
  ): Promise<{
    promotion: any;
    release: any;
  }> {
    const promotion = (await prisma.workflowPromotion.findUnique({
      where: { id: promotionId },
    })) as any;

    if (!promotion) throw new Error("Promotion not found");
    if (promotion.status !== "pending")
      throw new Error("Promotion is not in pending status");

    const workflow = (await prisma.workflow.findUnique({
      where: { id: promotion.workflowId },
    })) as any;

    const now = new Date();

    await prisma.workflowPromotion.update({
      where: { id: promotionId },
      data: {
        status: "rejected",
        approvedBy: rejectedBy,
        rejectionReason: reason,
        rejectedAt: now,
      } as any,
    });

    const targetEnv = (await prisma.environment.findFirst({
      where: { name: promotion.toEnvironment } as any,
    })) as any;

    const release = (await prisma.environmentRelease.create({
      data: {
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
      } as any,
    })) as any;

    const updatedPromotion = (await prisma.workflowPromotion.findUnique({
      where: { id: promotionId },
    })) as any;

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
    promotionId: string,
    rolledBackBy: string,
  ): Promise<{
    promotion: any;
    release: any;
  }> {
    const promotion = (await prisma.workflowPromotion.findUnique({
      where: { id: promotionId },
    })) as any;

    if (!promotion) throw new Error("Promotion not found");

    const workflow = (await prisma.workflow.findUnique({
      where: { id: promotion.workflowId },
    })) as any;

    await prisma.workflowPromotion.update({
      where: { id: promotionId },
      data: { status: "rolled_back" } as any,
    });

    const targetEnv = (await prisma.environment.findFirst({
      where: { name: promotion.toEnvironment } as any,
    })) as any;

    const release = (await prisma.environmentRelease.create({
      data: {
        environmentId: targetEnv?.id,
        releaseType: "workflow",
        artifactType: "workflow",
        artifactId: promotion.workflowId,
        fromEnvironment: promotion.fromEnvironment,
        toEnvironment: promotion.toEnvironment,
        status: "rolled_back",
        rollbackOf: promotionId,
        deployedBy: rolledBackBy,
      } as any,
    })) as any;

    const updatedPromotion = (await prisma.workflowPromotion.findUnique({
      where: { id: promotionId },
    })) as any;

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
