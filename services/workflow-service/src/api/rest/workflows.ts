/**
 * Workflow REST routes.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 */

import { Router, type IRouter } from "express";
import { prisma } from "@longox/db/prisma";
import {
  ListWorkflowsQueryParams,
  CreateWorkflowBody,
  GetWorkflowParams,
  UpdateWorkflowParams,
  UpdateWorkflowBody,
  DeleteWorkflowParams,
  ToggleWorkflowParams,
  RunWorkflowParams,
} from "@longox/api-zod";
import {
  startWorkflowExecution,
  writeAudit,
} from "@longox/execution-service/workflow-runner";
import { authorize } from "@longox/shared-rbac";
import { publishWorkflow } from "../../application/commands/publish-workflow.command";

const router: IRouter = Router();

function serializeWorkflow(w: any) {
  return {
    ...w,
    description: w.description ?? null,
    lastRunAt: w.lastRunAt ? new Date(w.lastRunAt).toISOString() : null,
    lastRunStatus: w.lastRunStatus ?? null,
    nodes: w.nodes ?? null,
    createdAt: new Date(w.createdAt).toISOString(),
    updatedAt: new Date(w.updatedAt).toISOString(),
  };
}

router.get(
  "/workflows",
  authorize({ resource: "workflows", action: "read" }),
  async (req, res): Promise<void> => {
    const params = ListWorkflowsQueryParams.safeParse(req.query);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const where: Record<string, unknown> = {};
    if (params.data.status) where.status = params.data.status;
    if (params.data.search)
      where.name = { contains: params.data.search, mode: "insensitive" };

    const workflows = await prisma.workflow.findMany({
      where,
      orderBy: { updatedAt: "asc" },
    });

    res.json(workflows.map(serializeWorkflow));
  },
);

router.post(
  "/workflows",
  authorize({ resource: "workflows", action: "write" }),
  async (req, res): Promise<void> => {
    const parsed = CreateWorkflowBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const { nodes, ...rest } = parsed.data;
    const nodeCount = nodes ? nodes.length : 0;

    const workflow = await prisma.workflow.create({
      data: { ...rest, nodes: nodes ?? null, nodeCount } as any,
    });

    await writeAudit(
      "workflow.created",
      "workflow",
      String(workflow.id),
      { name: workflow.name, triggerType: (workflow as any).triggerType },
      "user",
    );
    res.status(201).json(serializeWorkflow(workflow));
  },
);

router.get(
  "/workflows/:id",
  authorize({ resource: "workflows", action: "read" }),
  async (req, res): Promise<void> => {
    const params = GetWorkflowParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const workflow = await prisma.workflow.findUnique({
      where: { id: params.data.id },
    });
    if (!workflow) {
      res.status(404).json({ error: "Workflow not found" });
      return;
    }
    res.json(serializeWorkflow(workflow));
  },
);

router.patch(
  "/workflows/:id",
  authorize({ resource: "workflows", action: "write" }),
  async (req, res): Promise<void> => {
    const params = UpdateWorkflowParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const parsed = UpdateWorkflowBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const { nodes, ...rest } = parsed.data;
    const updates: Record<string, unknown> = { ...rest };
    if (nodes !== undefined) {
      updates.nodes = nodes;
      updates.nodeCount = nodes.length;
    }

    const workflow = await prisma.workflow
      .update({
        where: { id: params.data.id },
        data: updates as any,
      })
      .catch(() => null);
    if (!workflow) {
      res.status(404).json({ error: "Workflow not found" });
      return;
    }

    // Save a version snapshot when nodes are updated
    if (nodes !== undefined && nodes.length > 0) {
      const existing = await prisma.workflowVersion.findFirst({
        where: { workflowId: params.data.id },
        orderBy: { versionNumber: "desc" },
        select: { versionNumber: true },
      });
      const nextVersion = (existing?.versionNumber ?? 0) + 1;
      await prisma.workflowVersion.create({
        data: {
          workflowId: params.data.id,
          versionNumber: nextVersion,
          graphJson: { nodes } as any,
          checksum: "",
          releaseNotes: "Manual save",
        } as any,
      });
    }

    await writeAudit(
      "workflow.updated",
      "workflow",
      String(workflow.id),
      { name: workflow.name },
      "user",
    );
    res.json(serializeWorkflow(workflow));
  },
);

router.delete(
  "/workflows/:id",
  authorize({ resource: "workflows", action: "delete" }),
  async (req, res): Promise<void> => {
    const params = DeleteWorkflowParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const workflow = await prisma.workflow
      .delete({
        where: { id: params.data.id },
      })
      .catch(() => null);
    if (!workflow) {
      res.status(404).json({ error: "Workflow not found" });
      return;
    }

    await writeAudit(
      "workflow.deleted",
      "workflow",
      String(workflow.id),
      { name: workflow.name },
      "user",
    );
    res.sendStatus(204);
  },
);

router.post(
  "/workflows/:id/toggle",
  authorize({ resource: "workflows", action: "write" }),
  async (req, res): Promise<void> => {
    const params = ToggleWorkflowParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const existing = await prisma.workflow.findUnique({
      where: { id: params.data.id },
    });
    if (!existing) {
      res.status(404).json({ error: "Workflow not found" });
      return;
    }

    const newStatus = existing.status === "active" ? "inactive" : "active";
    const workflow = await prisma.workflow.update({
      where: { id: params.data.id },
      data: { status: newStatus },
    });

    await writeAudit(
      `workflow.${newStatus}`,
      "workflow",
      String(workflow.id),
      { previousStatus: existing.status },
      "user",
    );
    res.json(serializeWorkflow(workflow));
  },
);

router.post(
  "/workflows/:id/run",
  authorize({ resource: "workflows", action: "run" }),
  async (req, res): Promise<void> => {
    const params = RunWorkflowParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const workflow = await prisma.workflow.findUnique({
      where: { id: params.data.id },
    });
    if (!workflow) {
      res.status(404).json({ error: "Workflow not found" });
      return;
    }

    const nodes: any[] = Array.isArray((workflow as any).nodes)
      ? ((workflow as any).nodes as any[])
      : [];

    if (nodes.length === 0) {
      res.status(422).json({
        error: "Workflow has no nodes",
        message:
          "Add at least one trigger node to this workflow before running it.",
      });
      return;
    }

    const execution = await startWorkflowExecution(
      workflow.id,
      workflow.name,
      nodes,
      "manual",
      { _source: "manual" },
    );

    res.status(202).json({
      id: execution.id,
      workflowId: (execution as any).workflowId,
      workflowName: (execution as any).workflowName,
      status: (execution as any).status,
      startedAt: (execution as any).startedAt.toISOString(),
      finishedAt: null,
      durationMs: null,
      errorMessage: null,
    });
  },
);

router.post(
  "/workflows/:id/publish",
  authorize({ resource: "workflows", action: "write" }),
  async (req, res): Promise<void> => {
    const params = GetWorkflowParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const workflow = await prisma.workflow.findUnique({
      where: { id: params.data.id },
    });
    if (!workflow) {
      res.status(404).json({ error: "Workflow not found" });
      return;
    }

    const changeNote =
      (req.body as { changeNote?: string })?.changeNote ?? "Published";

    const rawNodes = (workflow as any).nodes as any;
    const graph = {
      nodes: Array.isArray(rawNodes)
        ? rawNodes
        : Array.isArray(rawNodes?.nodes)
          ? rawNodes.nodes
          : [],
      edges: Array.isArray(rawNodes?.edges) ? rawNodes.edges : [],
    };

    try {
      const result = await publishWorkflow({
        workflowId: params.data.id,
        tenantId: req.user!.tenantId ?? "",
        graph,
        changeNote,
        publishedBy: req.user!.name,
      });

      await writeAudit(
        "workflow.published",
        "workflow",
        String(params.data.id),
        { version: result.versionNumber, changeNote, diffId: result.diffId },
        "user",
      );

      res.status(201).json({
        id: result.versionId,
        workflowId: params.data.id,
        version: result.versionNumber,
        changeNote,
        published: true,
        diffComputed: result.diffId !== null,
        createdAt: result.publishedAt,
      });
    } catch (err: any) {
      const status = err.statusCode ?? 500;
      res.status(status).json({ error: err.message ?? "Publish failed" });
    }
  },
);

router.post(
  "/workflows/:id/duplicate",
  authorize({ resource: "workflows", action: "write" }),
  async (req, res): Promise<void> => {
    const params = GetWorkflowParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const existing = await prisma.workflow.findUnique({
      where: { id: params.data.id },
    });
    if (!existing) {
      res.status(404).json({ error: "Workflow not found" });
      return;
    }

    const workflow = await prisma.workflow.create({
      data: {
        name: `${existing.name} (copy)`,
        description: existing.description,
        status: "draft",
        triggerType: (existing as any).triggerType,
        nodeCount: (existing as any).nodeCount ?? 0,
        executionCount: 0,
        nodes: (existing as any).nodes,
      } as any,
    });

    await writeAudit(
      "workflow.duplicated",
      "workflow",
      String(workflow.id),
      { sourceId: existing.id, name: workflow.name },
      "user",
    );
    res.status(201).json({
      ...serializeWorkflow(workflow),
      lastRunAt: null,
      lastRunStatus: null,
    });
  },
);

router.get(
  "/workflows/:id/versions",
  authorize({ resource: "workflows", action: "read" }),
  async (req, res): Promise<void> => {
    const params = GetWorkflowParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const versions = await prisma.workflowVersion.findMany({
      where: { workflowId: params.data.id },
      orderBy: { versionNumber: "desc" },
      take: 20,
    });

    res.json(
      versions.map((v: any) => ({
        id: v.id,
        workflowId: v.workflowId,
        version: v.versionNumber,
        name: v.name,
        nodes: v.nodes,
        changeNote: v.changeNote ?? null,
        createdAt: new Date(v.createdAt).toISOString(),
      })),
    );
  },
);

// ─── Workflow Promotions ──────────────────────────────────────────────────────

router.get(
  "/workflows/:id/promotions",
  authorize({ resource: "workflows", action: "read" }),
  async (req, res): Promise<void> => {
    const params = GetWorkflowParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const workflow = await prisma.workflow.findUnique({
      where: { id: params.data.id },
    });
    if (!workflow) {
      res.status(404).json({ error: "Workflow not found" });
      return;
    }

    const promotions = await prisma.workflowPromotion.findMany({
      where: { workflowId: params.data.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    res.json(
      promotions.map((p: any) => ({
        id: p.id,
        workflowId: p.workflowId,
        workflowName: p.workflowName,
        fromEnvironment: p.fromEnvironment,
        toEnvironment: p.toEnvironment,
        status: p.status,
        promotedBy: p.promotedBy,
        approvedBy: p.approvedBy ?? null,
        notes: p.notes ?? null,
        createdAt: new Date(p.createdAt).toISOString(),
      })),
    );
  },
);

router.post(
  "/workflows/:id/promotions",
  authorize({ resource: "workflows", action: "write" }),
  async (req, res): Promise<void> => {
    const params = GetWorkflowParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const workflow = await prisma.workflow.findUnique({
      where: { id: params.data.id },
    });
    if (!workflow) {
      res.status(404).json({ error: "Workflow not found" });
      return;
    }

    const { fromEnvironment, toEnvironment, notes } = req.body as {
      fromEnvironment?: string;
      toEnvironment?: string;
      notes?: string;
    };

    if (!fromEnvironment || !toEnvironment) {
      res
        .status(400)
        .json({ error: "fromEnvironment and toEnvironment are required" });
      return;
    }

    const promotion = await prisma.workflowPromotion.create({
      data: {
        workflowId: workflow.id,
        workflowName: workflow.name,
        fromEnvironment,
        toEnvironment,
        status: "promoted",
        promotedBy: "user",
        notes: notes ?? null,
      } as any,
    });

    await writeAudit(
      "workflow.promoted",
      "workflow",
      String(workflow.id),
      { fromEnvironment, toEnvironment },
      "user",
    );

    res.status(201).json({
      id: promotion.id,
      workflowId: (promotion as any).workflowId,
      workflowName: (promotion as any).workflowName,
      fromEnvironment: (promotion as any).fromEnvironment,
      toEnvironment: (promotion as any).toEnvironment,
      status: (promotion as any).status,
      promotedBy: (promotion as any).promotedBy,
      approvedBy: (promotion as any).approvedBy ?? null,
      notes: (promotion as any).notes ?? null,
      createdAt: new Date((promotion as any).createdAt).toISOString(),
    });
  },
);

export default router;
