/**
 * Publish workflow command.
 *
 * Creates a new workflow version, computes the RFC 6902 JSON Patch diff
 * against the previous version, and persists both to the database.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 */

import { prisma } from "@longox/db/prisma";
import { computeFullDiff } from "@longox/workflow-canvas";
import type { WorkflowGraph } from "@longox/workflow-canvas";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PublishWorkflowCommand {
  workflowId: string;
  changeNote?: string;
}

export interface PublishWorkflowInput {
  workflowId: string;
  tenantId: string;
  graph: WorkflowGraph;
  changeNote?: string;
  publishedBy?: string;
  /** Optimistic lock — version the caller expects as the current latest */
  expectedDraftVersion?: number;
}

export interface PublishWorkflowResult {
  versionId: string;
  versionNumber: number;
  checksum: string;
  diffId: string | null;
  publishedAt: string;
}

// ─── Command handler ──────────────────────────────────────────────────────────

export async function publishWorkflow(
  input: PublishWorkflowInput,
): Promise<PublishWorkflowResult> {
  const {
    workflowId,
    tenantId,
    graph,
    changeNote,
    publishedBy,
    expectedDraftVersion,
  } = input;

  // ── 1. Verify workflow ownership ────────────────────────────────────────────

  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, tenantId },
  });

  if (!workflow) {
    throw Object.assign(new Error("Workflow not found"), { statusCode: 404 });
  }

  // ── 2. Load latest version for diff & optimistic lock ───────────────────────

  const latestVersion = await prisma.workflowVersion.findFirst({
    where: { workflowId },
    orderBy: { versionNumber: "desc" },
  });

  const nextVersionNumber = (latestVersion?.versionNumber ?? 0) + 1;

  if (
    expectedDraftVersion !== undefined &&
    latestVersion !== undefined &&
    latestVersion?.versionNumber !== expectedDraftVersion
  ) {
    throw Object.assign(
      new Error(
        `Version conflict: expected draft version ${expectedDraftVersion} but current is ${latestVersion?.versionNumber}`,
      ),
      { statusCode: 409 },
    );
  }

  // ── 3. Compute checksum ─────────────────────────────────────────────────────

  const graphJson = JSON.stringify({
    nodes: graph.nodes ?? [],
    edges: graph.edges ?? [],
  });
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
      versionNumber: latestVersion?.versionNumber,
      checksum,
      diffId: null,
      publishedAt:
        latestVersion.createdAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  // ── 4. Insert new version ───────────────────────────────────────────────────

  const newVersion = await prisma.workflowVersion.create({
    data: {
      workflowId,
      versionNumber: nextVersionNumber,
      graphJson: graph as any,
      checksum: checksum,
      releaseNotes: changeNote ?? `v${nextVersionNumber}`,
      createdById: publishedBy ?? null,
    } as any,
  });

  // ── 5. Compute and persist diff ─────────────────────────────────────────────

  let diffId: string | null = null;

  if (latestVersion) {
    const prevGraph: WorkflowGraph = {
      nodes: Array.isArray(latestVersion.graphJson)
        ? (latestVersion.graphJson as any[])
        : [],
      edges: Array.isArray((latestVersion as any).graphJson?.edges ?? [])
        ? (latestVersion as any).graphJson?.edges ?? []
        : [],
    };

    const diff = computeFullDiff(
      prevGraph,
      graph,
      latestVersion?.versionNumber,
      nextVersionNumber,
    );

    if (diff.patch.length > 0) {
      const diffRow = await prisma.workflowDiff.create({
        data: {
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
            semanticChanges: diff.semanticChanges.map(
              (c: {
                type: string;
                description: string;
                nodeId?: string;
                edgeId?: string;
              }) => ({
                type: c.type,
                description: c.description,
                nodeId: c.nodeId,
                edgeId: c.edgeId,
              }),
            ),
          } as any,
          createdBy: publishedBy ?? null,
        } as any,
      });

      diffId = diffRow.id;
    }
  }

  // ── 6. Update workflow status ───────────────────────────────────────────────

  await prisma.workflow.update({
    where: { id: workflowId },
    data: {
      status: "active",
      currentVersionId: newVersion.id,
      updatedAt: new Date(),
    } as any,
  });

  return {
    versionId: newVersion.id,
    versionNumber: nextVersionNumber,
    checksum,
    diffId,
    publishedAt:
      newVersion.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}
