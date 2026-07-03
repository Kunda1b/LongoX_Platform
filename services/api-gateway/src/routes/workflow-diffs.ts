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
import { eq, and, desc } from "drizzle-orm";
import {
  db,
  workflowsTable,
  workflowVersionsTable,
  workflowDiffsTable,
} from "@longox/db";
import { authorize } from "@longox/shared-rbac";
import { computeFullDiff, renderSemanticDiff } from "@longox/workflow-canvas";
import type { WorkflowGraph } from "@longox/workflow-canvas";

const router = Router();

// ─── GET /api/workflows/:id/diffs ─────────────────────────────────────────────

router.get(
  ["/api/workflows/:id/diffs", "/api/v1/workflows/:id/diffs"],
  authorize("workflows:read"),
  async (req: Request, res: Response): Promise<void> => {
    const workflowId = parseInt(String(req.params["id"] ?? "0"), 10);
    const tenantId = req.user?.tenantId ?? null;

    const [workflow] = await db
      .select({ id: workflowsTable.id, tenantId: workflowsTable.tenantId })
      .from(workflowsTable)
      .where(eq(workflowsTable.id, workflowId))
      .limit(1);

    if (!workflow) {
      res.status(404).json({ error: "Workflow not found" });
      return;
    }

    if (tenantId !== null && workflow.tenantId !== tenantId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const diffs = await db
      .select({
        id: workflowDiffsTable.id,
        workflowId: workflowDiffsTable.workflowId,
        fromVersionId: workflowDiffsTable.fromVersionId,
        toVersionId: workflowDiffsTable.toVersionId,
        patchHash: workflowDiffsTable.patchHash,
        summary: workflowDiffsTable.summary,
        createdBy: workflowDiffsTable.createdBy,
        createdAt: workflowDiffsTable.createdAt,
      })
      .from(workflowDiffsTable)
      .where(eq(workflowDiffsTable.workflowId, workflowId))
      .orderBy(desc(workflowDiffsTable.createdAt));

    // Enrich with version numbers
    const versionIds = [
      ...new Set([
        ...diffs.map((d) => d.fromVersionId),
        ...diffs.map((d) => d.toVersionId),
      ]),
    ];

    const versions =
      versionIds.length > 0
        ? await db
            .select({
              id: workflowVersionsTable.id,
              version: workflowVersionsTable.version,
            })
            .from(workflowVersionsTable)
            .where(eq(workflowVersionsTable.workflowId, workflowId))
        : [];

    const versionMap = new Map(versions.map((v) => [v.id, v.version]));

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
        createdAt: d.createdAt?.toISOString(),
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
    const workflowId = parseInt(String(req.params["id"] ?? "0"), 10);
    const fromVersion = parseInt(String(req.params["fromVersion"] ?? "0"), 10);
    const toVersion = parseInt(String(req.params["toVersion"] ?? "0"), 10);
    const tenantId = req.user?.tenantId ?? null;

    if (fromVersion <= 0 || toVersion <= 0) {
      res.status(400).json({ error: "Invalid version numbers" });
      return;
    }

    // Check workflow access
    const [workflow] = await db
      .select({ id: workflowsTable.id, tenantId: workflowsTable.tenantId })
      .from(workflowsTable)
      .where(eq(workflowsTable.id, workflowId))
      .limit(1);

    if (!workflow) {
      res.status(404).json({ error: "Workflow not found" });
      return;
    }

    if (tenantId !== null && workflow.tenantId !== tenantId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    // Load both versions
    const [fromVer, toVer] = await Promise.all([
      db
        .select()
        .from(workflowVersionsTable)
        .where(
          and(
            eq(workflowVersionsTable.workflowId, workflowId),
            eq(workflowVersionsTable.version, fromVersion),
          ),
        )
        .limit(1),
      db
        .select()
        .from(workflowVersionsTable)
        .where(
          and(
            eq(workflowVersionsTable.workflowId, workflowId),
            eq(workflowVersionsTable.version, toVersion),
          ),
        )
        .limit(1),
    ]);

    if (!fromVer[0] || !toVer[0]) {
      res.status(404).json({ error: "One or both versions not found" });
      return;
    }

    // Check if pre-computed diff exists
    const [cached] = await db
      .select()
      .from(workflowDiffsTable)
      .where(
        and(
          eq(workflowDiffsTable.workflowId, workflowId),
          eq(workflowDiffsTable.fromVersionId, fromVer[0].id),
          eq(workflowDiffsTable.toVersionId, toVer[0].id),
        ),
      )
      .limit(1);

    if (cached) {
      res.json({
        workflowId,
        fromVersion,
        toVersion,
        patchHash: cached.patchHash,
        patch: cached.patch,
        summary: cached.summary,
        createdBy: cached.createdBy,
        createdAt: cached.createdAt?.toISOString(),
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
    const workflowId = parseInt(String(req.params["id"] ?? "0"), 10);
    const fromVersion = parseInt(String(req.params["fromVersion"] ?? "0"), 10);
    const toVersion = parseInt(String(req.params["toVersion"] ?? "0"), 10);
    const tenantId = req.user?.tenantId ?? null;

    const [workflow] = await db
      .select({ id: workflowsTable.id, tenantId: workflowsTable.tenantId })
      .from(workflowsTable)
      .where(eq(workflowsTable.id, workflowId))
      .limit(1);

    if (!workflow) {
      res.status(404).json({ error: "Workflow not found" });
      return;
    }

    if (tenantId !== null && workflow.tenantId !== tenantId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const [fromVer, toVer] = await Promise.all([
      db
        .select()
        .from(workflowVersionsTable)
        .where(
          and(
            eq(workflowVersionsTable.workflowId, workflowId),
            eq(workflowVersionsTable.version, fromVersion),
          ),
        )
        .limit(1),
      db
        .select()
        .from(workflowVersionsTable)
        .where(
          and(
            eq(workflowVersionsTable.workflowId, workflowId),
            eq(workflowVersionsTable.version, toVersion),
          ),
        )
        .limit(1),
    ]);

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

function extractGraph(
  version: typeof workflowVersionsTable.$inferSelect,
): WorkflowGraph {
  const nodes = Array.isArray(version.nodes) ? (version.nodes as any[]) : [];
  const edges = Array.isArray((version as any).edges)
    ? (version as any).edges
    : [];
  return { nodes, edges };
}

export default router;
