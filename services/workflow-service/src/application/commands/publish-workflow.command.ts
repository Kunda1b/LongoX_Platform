/**
 * Publish workflow command.
 *
 * Creates a new workflow version, computes the RFC 6902 JSON Patch diff
 * against the previous version, and persists both to the database.
 *
 * Diff persistence:
 *   - workflow_versions.nodes / edges — full graph snapshot
 *   - workflow_diffs.patch          — RFC 6902 JSON Patch (from prev → this)
 *   - workflow_diffs.summary        — semantic change counts + descriptions
 *   - workflow_diffs.patch_hash     — deduplication hash
 */

import { eq, and, sql } from "drizzle-orm";
import {
  db,
  workflowsTable,
  workflowVersionsTable,
  workflowDiffsTable,
} from "@longox/db";
import { computeFullDiff } from "@longox/workflow-canvas";
import type { WorkflowGraph } from "@longox/workflow-canvas";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PublishWorkflowCommand {
  workflowId: number;
  changeNote?: string;
}

export interface PublishWorkflowInput {
  workflowId: number;
  tenantId: number;
  graph: WorkflowGraph;
  changeNote?: string;
  publishedBy?: string;
  /** Optimistic lock — version the caller expects as the current latest */
  expectedDraftVersion?: number;
}

export interface PublishWorkflowResult {
  versionId: number;
  versionNumber: number;
  checksum: string;
  diffId: number | null;
  publishedAt: string;
}

// ─── Command handler ──────────────────────────────────────────────────────────

export async function publishWorkflow(
  input: PublishWorkflowInput,
): Promise<PublishWorkflowResult> {
  const { workflowId, tenantId, graph, changeNote, publishedBy, expectedDraftVersion } =
    input;

  // ── 1. Verify workflow ownership ────────────────────────────────────────────

  const [workflow] = await db
    .select()
    .from(workflowsTable)
    .where(
      and(
        eq(workflowsTable.id, workflowId),
        eq(workflowsTable.tenantId, tenantId),
      ),
    )
    .limit(1);

  if (!workflow) {
    throw Object.assign(new Error("Workflow not found"), { statusCode: 404 });
  }

  // ── 2. Load latest version for diff & optimistic lock ───────────────────────

  const [latestVersion] = await db
    .select()
    .from(workflowVersionsTable)
    .where(eq(workflowVersionsTable.workflowId, workflowId))
    .orderBy(sql`${workflowVersionsTable.version} DESC`)
    .limit(1);

  const nextVersionNumber = (latestVersion?.version ?? 0) + 1;

  if (
    expectedDraftVersion !== undefined &&
    latestVersion !== undefined &&
    latestVersion.version !== expectedDraftVersion
  ) {
    throw Object.assign(
      new Error(
        `Version conflict: expected draft version ${expectedDraftVersion} but current is ${latestVersion.version}`,
      ),
      { statusCode: 409 },
    );
  }

  // ── 3. Compute checksum ─────────────────────────────────────────────────────

  const graphJson = JSON.stringify({ nodes: graph.nodes ?? [], edges: graph.edges ?? [] });
  let hash = 0;
  for (let i = 0; i < graphJson.length; i++) {
    const c = graphJson.charCodeAt(i);
    hash = (hash << 5) - hash + c;
    hash |= 0;
  }
  const checksum = Math.abs(hash).toString(16).padStart(16, "0");

  // Deduplicate: no-op if graph is identical to latest
  if (latestVersion && (latestVersion as any).checksum === checksum) {
    return {
      versionId: latestVersion.id,
      versionNumber: latestVersion.version,
      checksum,
      diffId: null,
      publishedAt:
        latestVersion.createdAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  // ── 4. Insert new version ───────────────────────────────────────────────────

  const [newVersion] = await db
    .insert(workflowVersionsTable)
    .values({
      workflowId,
      version: nextVersionNumber,
      name: workflow.name,
      nodes: graph.nodes as any,
      changeNote: changeNote ?? `v${nextVersionNumber}`,
      publishedBy: publishedBy ?? null,
    } as any)
    .returning();

  // ── 5. Compute and persist diff ─────────────────────────────────────────────

  let diffId: number | null = null;

  if (latestVersion) {
    const prevGraph: WorkflowGraph = {
      nodes: Array.isArray(latestVersion.nodes)
        ? (latestVersion.nodes as any[])
        : [],
      edges: Array.isArray((latestVersion as any).edges)
        ? (latestVersion as any).edges
        : [],
    };

    const diff = computeFullDiff(prevGraph, graph, latestVersion.version, nextVersionNumber);

    if (diff.patch.length > 0) {
      const [diffRow] = await db
        .insert(workflowDiffsTable)
        .values({
          workflowId,
          fromVersionId: latestVersion.id,
          toVersionId: newVersion.id,
          patch: diff.patch as any,
          patchHash: diff.patchHash,
          summary: {
            nodesAdded: diff.summary.nodesAdded,
            nodesRemoved: diff.summary.nodesRemoved,
            nodesRenamed: diff.summary.nodesRenamed,
            nodesMoved: diff.summary.nodesMoved,
            nodesConfigChanged: diff.summary.nodesConfigChanged,
            nodesTypeChanged: diff.summary.nodesTypeChanged,
            edgesAdded: diff.summary.edgesAdded,
            edgesRemoved: diff.summary.edgesRemoved,
            edgesRewired: diff.summary.edgesRewired,
            totalChanges: diff.summary.totalChanges,
            semanticChanges: diff.semanticChanges.map((c) => ({
              type: c.type,
              description: c.description,
              nodeId: c.nodeId,
              edgeId: c.edgeId,
            })),
          } as any,
          createdBy: publishedBy ?? null,
        })
        .returning();

      diffId = diffRow.id;
    }
  }

  // ── 6. Update workflow status ───────────────────────────────────────────────

  await db
    .update(workflowsTable)
    .set({
      status: "active",
      currentVersionId: newVersion.id,
      updatedAt: new Date(),
    } as any)
    .where(eq(workflowsTable.id, workflowId));

  return {
    versionId: newVersion.id,
    versionNumber: nextVersionNumber,
    checksum,
    diffId,
    publishedAt: newVersion.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}
