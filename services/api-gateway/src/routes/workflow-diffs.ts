/**
 * Workflow version diffs API.
 *
 * GET /api/workflows/:id/diffs
 *   Returns a list of version-to-version diffs for a workflow.
 *   Each diff includes the RFC 6902 JSON Patch and semantic changes.
 *
 * GET /api/workflows/:id/diffs/:fromVersion/:toVersion
 *   Returns the specific diff between two versions.
 *   Computes on-the-fly if not cached in workflow_diffs.
 *
 * GET /api/workflows/:id/diffs/:fromVersion/:toVersion/render
 *   Returns the diff as rendered UI data (grouped semantic changes).
 */

import { Router, type Request, type Response } from "express";
import { prisma } from "@longox/db/prisma";
import { authorize } from "@longox/shared-rbac";
import { computeFullDiff, renderSemanticDiff } from "@longox/workflow-canvas";
import type { WorkflowGraph } from "@longox/workflow-canvas";

const router = Router();

// ─── GET /api/workflows/:id/diffs ─────────────────────────────────────────────

router.get(
  ["/api/workflows/:id/diffs", "/api/v1/workflows/:id/diffs"],
  authorize("workflows:read"),
  async (req: Request, res: Response): Promise<void> => {
    const workflowId = String(req.params["id"] ?? "");
    const tenantId = req.user?.tenantId ?? null;

    const workflow = (await prisma.workflow.findUnique({
      where: { id: workflowId },
      select: { id: true, tenantId: true },
    })) as any;

    if (!workflow) {
      res.status(404).json({ error: "Workflow not found" });
      return;
    }

    if (tenantId !== null && workflow.tenantId !== tenantId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const diffs = (await prisma.workflowDiff.findMany({
      where: { workflowId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        workflowId: true,
        fromVersionId: true,
        toVersionId: true,
        patchHash: true,
        summary: true,
        createdBy: true,
        createdAt: true,
      } as any,
    })) as any[];

    // Enrich with version numbers
    const versionIds = [
      ...new Set([
        ...diffs.map((d) => d.fromVersionId),
        ...diffs.map((d) => d.toVersionId),
      ]),
    ];

    const versions = versionIds.length
      ? ((await prisma.workflowVersion.findMany({
          where: { workflowId },
          select: { id: true, versionNumber: true } as any,
        })) as any[])
      : [];

    const versionMap = new Map(versions.map((v) => [v.id, v.versionNumber]));

    res.json(
      diffs.map((d) => ({
        id: d.id,
        workflowId: d.workflowId,
        fromVersionId: d.fromVersionId,
        toVersionId: d.toVersionId,
        fromVersion: versionMap.get(d.fromVersionId),
        toVersion: versionMap.get(d.toVersionId),
        patchHash: d.patchHash,
        summary: d.summary,
        createdBy: d.createdBy,
        createdAt:
          d.createdAt instanceof Date
            ? d.createdAt.toISOString()
            : d.createdAt
              ? new Date(d.createdAt).toISOString()
              : null,
      })),
    );
  },
);

// ─── GET /api/workflows/:id/diffs/:fromVersion/:toVersion ─────────────────────

router.get(
  [
    "/api/workflows/:id/diffs/:fromVersion/:toVersion",
    "/api/v1/workflows/:id/diffs/:fromVersion/:toVersion",
  ],
  authorize("workflows:read"),
  async (req: Request, res: Response): Promise<void> => {
    const workflowId = String(req.params["id"] ?? "");
    const fromVersion = parseInt(String(req.params["fromVersion"] ?? "0"), 10);
    const toVersion = parseInt(String(req.params["toVersion"] ?? "0"), 10);
    const tenantId = req.user?.tenantId ?? null;

    if (fromVersion <= 0 || toVersion <= 0) {
      res.status(400).json({ error: "Invalid version numbers" });
      return;
    }

    // Check workflow access
    const workflow = (await prisma.workflow.findUnique({
      where: { id: workflowId },
      select: { id: true, tenantId: true },
    })) as any;

    if (!workflow) {
      res.status(404).json({ error: "Workflow not found" });
      return;
    }

    if (tenantId !== null && workflow.tenantId !== tenantId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    // Load both versions
    const [fromVerRow, toVerRow] = await Promise.all([
      prisma.workflowVersion.findFirst({
        where: { workflowId, versionNumber: fromVersion } as any,
      }) as Promise<any>,
      prisma.workflowVersion.findFirst({
        where: { workflowId, versionNumber: toVersion } as any,
      }) as Promise<any>,
    ]);
    const fromVer = fromVerRow ? [fromVerRow] : [];
    const toVer = toVerRow ? [toVerRow] : [];

    if (!fromVer[0] || !toVer[0]) {
      res.status(404).json({ error: "One or both versions not found" });
      return;
    }

    // Check if pre-computed diff exists
    const cached = (await prisma.workflowDiff.findFirst({
      where: {
        workflowId,
        fromVersionId: fromVer[0].id,
        toVersionId: toVer[0].id,
      },
    })) as any;

    if (cached) {
      res.json({
        workflowId,
        fromVersion,
        toVersion,
        patchHash: cached.patchHash,
        patch: (cached as any).patch ?? cached.patchJson,
        summary: cached.summary,
        createdBy: cached.createdBy,
        createdAt:
          cached.createdAt instanceof Date
            ? cached.createdAt.toISOString()
            : cached.createdAt
              ? new Date(cached.createdAt).toISOString()
              : null,
      });
      return;
    }

    // Compute on-the-fly
    const fromGraph = extractGraph(fromVer[0]);
    const toGraph = extractGraph(toVer[0]);

    const diff = computeFullDiff(fromGraph, toGraph, fromVersion, toVersion);

    res.json({
      workflowId,
      fromVersion,
      toVersion,
      patchHash: diff.patchHash,
      patch: diff.patch,
      semanticChanges: diff.semanticChanges,
      summary: diff.summary,
    });
  },
);

// ─── GET /api/workflows/:id/diffs/:fromVersion/:toVersion/render ──────────────

router.get(
  [
    "/api/workflows/:id/diffs/:fromVersion/:toVersion/render",
    "/api/v1/workflows/:id/diffs/:fromVersion/:toVersion/render",
  ],
  authorize("workflows:read"),
  async (req: Request, res: Response): Promise<void> => {
    const workflowId = String(req.params["id"] ?? "");
    const fromVersion = parseInt(String(req.params["fromVersion"] ?? "0"), 10);
    const toVersion = parseInt(String(req.params["toVersion"] ?? "0"), 10);
    const tenantId = req.user?.tenantId ?? null;

    const workflow = (await prisma.workflow.findUnique({
      where: { id: workflowId },
      select: { id: true, tenantId: true },
    })) as any;

    if (!workflow) {
      res.status(404).json({ error: "Workflow not found" });
      return;
    }

    if (tenantId !== null && workflow.tenantId !== tenantId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const [fromVerRow, toVerRow] = await Promise.all([
      prisma.workflowVersion.findFirst({
        where: { workflowId, versionNumber: fromVersion } as any,
      }) as Promise<any>,
      prisma.workflowVersion.findFirst({
        where: { workflowId, versionNumber: toVersion } as any,
      }) as Promise<any>,
    ]);
    const fromVer = fromVerRow ? [fromVerRow] : [];
    const toVer = toVerRow ? [toVerRow] : [];

    if (!fromVer[0] || !toVer[0]) {
      res.status(404).json({ error: "One or both versions not found" });
      return;
    }

    const fromGraph = extractGraph(fromVer[0]);
    const toGraph = extractGraph(toVer[0]);
    const diff = computeFullDiff(fromGraph, toGraph, fromVersion, toVersion);
    const rendered = renderSemanticDiff(diff.semanticChanges);

    res.json({
      workflowId,
      fromVersion,
      toVersion,
      rendered,
      summary: diff.summary,
    });
  },
);

// ─── Helper ───────────────────────────────────────────────────────────────────

function extractGraph(version: any): WorkflowGraph {
  const nodes = Array.isArray((version as any).nodes)
    ? (version.nodes as any[])
    : Array.isArray((version as any).graphJson)
      ? (((version as any).graphJson as any)?.nodes ?? [])
      : [];
  const edges = Array.isArray((version as any).edges)
    ? (version as any).edges
    : Array.isArray((version as any).graphJson)
      ? (((version as any).graphJson as any)?.edges ?? [])
      : [];
  return { nodes, edges };
}

export default router;
