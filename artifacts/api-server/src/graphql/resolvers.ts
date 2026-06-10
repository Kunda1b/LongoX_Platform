import { eq, desc, and, sql } from "drizzle-orm";
import {
  db,
  workflowsTable,
  workflowVersionsTable,
  executionsTable,
  executionCheckpointsTable,
  dashboardsTable,
  dashboardVersionsTable,
  connectorsTable,
  connectorVersionsTable,
  templatesTable,
  templateVersionsTable,
  usersTable,
  tenantsTable,
} from "@longox/db";
import { realtimeHub } from "@longox/shared-realtime";
import { createEvent } from "@longox/shared-events";
import type { PlatformEventType } from "@longox/shared-events";

interface ResolverContext {
  user?: {
    id: number;
    email: string;
    name: string;
    tenantId: number | null;
    role: string;
  };
}

async function listWorkflows(limit = 50, offset = 0) {
  const rows = await db
    .select()
    .from(workflowsTable)
    .orderBy(desc(workflowsTable.updatedAt))
    .limit(limit)
    .offset(offset);
  return rows.map(serializeWorkflow);
}

async function getWorkflow(id: number) {
  const [row] = await db
    .select()
    .from(workflowsTable)
    .where(eq(workflowsTable.id, id));
  if (!row) return null;
  return serializeWorkflow(row);
}

async function getWorkflowVersion(id: number) {
  const [row] = await db
    .select()
    .from(workflowVersionsTable)
    .where(eq(workflowVersionsTable.id, id));
  if (!row) return null;
  return serializeVersion(row);
}

async function getWorkflowVersions(workflowId: number) {
  const rows = await db
    .select()
    .from(workflowVersionsTable)
    .where(eq(workflowVersionsTable.workflowId, workflowId))
    .orderBy(desc(workflowVersionsTable.version));
  return rows.map(serializeVersion);
}

async function listExecutions(workflowId?: number, limit = 50, offset = 0) {
  const conditions = [];
  if (workflowId) conditions.push(eq(executionsTable.workflowId, workflowId));

  const rows = await db
    .select()
    .from(executionsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(executionsTable.startedAt))
    .limit(limit)
    .offset(offset);
  return rows.map(serializeExecution);
}

async function getExecution(id: number) {
  const [row] = await db
    .select()
    .from(executionsTable)
    .where(eq(executionsTable.id, id));
  if (!row) return null;
  const steps = await db
    .select()
    .from(executionCheckpointsTable)
    .where(eq(executionCheckpointsTable.executionId, id));
  return { ...serializeExecution(row), steps: steps.map(serializeStep) };
}

function serializeWorkflow(row: typeof workflowsTable.$inferSelect) {
  const nodes = (row.nodes as any[]) ?? [];
  const edges = (row.edges as any[]) ?? [];
  return {
    id: String(row.id),
    name: row.name,
    status: row.status ?? "draft",
    description: (row as any).description ?? null,
    nodes: nodes.map((n: any) => ({
      id: n.id,
      name: n.name ?? n.label ?? "",
      type: n.type,
      nodeTypeId: n.nodeTypeId,
      position: n.position ?? null,
      config: n.config ?? null,
    })),
    edges: edges.map((e: any) => ({
      id: e.id,
      source: e.source ?? e.sourceNodeId,
      target: e.target ?? e.targetNodeId,
      sourceHandle: e.sourceHandle ?? null,
      targetHandle: e.targetHandle ?? null,
      label: e.label ?? null,
    })),
    versions: [],
    currentVersion: null,
    createdAt:
      (row.createdAt as any)?.toISOString?.() ?? new Date().toISOString(),
    updatedAt:
      (row.updatedAt as any)?.toISOString?.() ?? new Date().toISOString(),
    lastRunStatus: row.lastRunStatus ?? null,
    lastRunAt: row.lastRunAt?.toISOString?.() ?? null,
    executionCount: row.executionCount ?? 0,
  };
}

function serializeVersion(row: typeof workflowVersionsTable.$inferSelect) {
  return {
    id: String(row.id),
    versionNumber: row.version,
    graph: (row as any).nodes ?? null,
    checksum: (row as any).checksum ?? null,
    status: "published",
    message: (row as any).changeNote ?? null,
    createdAt:
      (row.createdAt as any)?.toISOString?.() ?? new Date().toISOString(),
    isActive: false,
  };
}

function serializeExecution(row: typeof executionsTable.$inferSelect) {
  return {
    id: String(row.id),
    workflowId: String(row.workflowId),
    workflowName: row.workflowName,
    status: row.status,
    startedAt: row.startedAt.toISOString(),
    finishedAt: row.finishedAt?.toISOString() ?? null,
    durationMs: row.durationMs ?? null,
    errorMessage: row.errorMessage ?? null,
    steps: [],
  };
}

function serializeStep(row: typeof executionCheckpointsTable.$inferSelect) {
  return {
    nodeId: String(row.nodeId),
    nodeName: row.nodeName,
    status: row.status,
    durationMs: null,
    error: null,
  };
}

export const resolvers = {
  JSON: {
    __serialize: (value: unknown) => value,
    __parseValue: (value: unknown) => value,
    __parseLiteral: (ast: any) => ast.value,
  },

  Query: {
    me: async (_: unknown, __: unknown, ctx: ResolverContext) => {
      if (!ctx.user) return null;
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, ctx.user.id));
      if (!user) return null;
      return {
        id: String(user.id),
        email: user.email,
        name: user.name,
        tenantId: user.tenantId ? String(user.tenantId) : null,
        role: user.role,
        permissions: [],
      };
    },

    workflows: async (_: unknown, args: { limit?: number; offset?: number }) =>
      listWorkflows(args.limit ?? 50, args.offset ?? 0),

    workflow: async (_: unknown, args: { id: string }) => {
      const wf = await getWorkflow(Number(args.id));
      if (!wf) return null;
      wf.versions = await getWorkflowVersions(Number(args.id));
      return wf;
    },

    workflowVersion: async (_: unknown, args: { id: string }) =>
      getWorkflowVersion(Number(args.id)),

    executions: async (
      _: unknown,
      args: { workflowId?: string; limit?: number; offset?: number },
    ) =>
      listExecutions(
        args.workflowId ? Number(args.workflowId) : undefined,
        args.limit ?? 50,
        args.offset ?? 0,
      ),

    execution: async (_: unknown, args: { id: string }) =>
      getExecution(Number(args.id)),

    dashboards: async (
      _: unknown,
      args: { limit?: number; offset?: number },
    ) => {
      const rows = await db
        .select()
        .from(dashboardsTable)
        .orderBy(desc(dashboardsTable.updatedAt))
        .limit(args.limit ?? 50)
        .offset(args.offset ?? 0);
      return rows.map((r) => ({
        id: String(r.id),
        title: r.title,
        status: r.status ?? "draft",
        version: r.version ?? 1,
        createdAt: (r.createdAt as any)?.toISOString?.() ?? "",
        updatedAt: (r.updatedAt as any)?.toISOString?.() ?? "",
        widgets: [],
      }));
    },

    connectors: async (
      _: unknown,
      args: { limit?: number; offset?: number },
    ) => {
      const rows = await db
        .select()
        .from(connectorsTable)
        .limit(args.limit ?? 50)
        .offset(args.offset ?? 0);
      return rows.map((r) => ({
        id: String(r.id),
        name: r.name,
        slug: r.slug,
        version: r.version ?? "1.0.0",
        trustLevel: (r as any).trustLevel ?? "community",
        authMethods: [],
        actions: [],
        triggers: [],
      }));
    },

    templates: async (
      _: unknown,
      args: { limit?: number; offset?: number },
    ) => {
      const rows = await db
        .select()
        .from(templatesTable)
        .limit(args.limit ?? 50)
        .offset(args.offset ?? 0);
      return rows.map((r) => ({
        id: String(r.id),
        name: r.name,
        category: r.category ?? "general",
        version: r.version ?? "1.0.0",
        installCount: r.installCount ?? 0,
        createdAt: (r.createdAt as any)?.toISOString?.() ?? "",
      }));
    },
  },

  Mutation: {
    publishWorkflow: async (
      _: unknown,
      args: { id: string; message?: string },
      ctx: ResolverContext,
    ) => {
      const wfId = Number(args.id);
      const [workflow] = await db
        .select()
        .from(workflowsTable)
        .where(eq(workflowsTable.id, wfId));
      if (!workflow) throw new Error("Workflow not found");

      const existing = await db
        .select({ version: workflowVersionsTable.version })
        .from(workflowVersionsTable)
        .where(eq(workflowVersionsTable.workflowId, wfId))
        .orderBy(desc(workflowVersionsTable.version))
        .limit(1);
      const nextVersion = (existing[0]?.version ?? 0) + 1;

      const [version] = await db
        .insert(workflowVersionsTable)
        .values({
          workflowId: wfId,
          version: nextVersion,
          name: workflow.name,
          nodes: workflow.nodes as any[],
          changeNote: args.message ?? "",
        })
        .returning();

      await db
        .update(workflowsTable)
        .set({ status: "published", updatedAt: new Date() })
        .where(eq(workflowsTable.id, wfId));

      const event = createEvent(
        "workflow.published",
        String(wfId),
        "workflow",
        { versionNumber: nextVersion, message: args.message },
        { id: String(ctx.user?.id), type: "user" },
      );
      realtimeHub.broadcast(event);

      return {
        version: serializeVersion(version),
        validationResult: { valid: true, errors: [], warnings: [] },
      };
    },

    createExecution: async (
      _: unknown,
      args: { workflowId: string; triggerType: string },
    ) => {
      const wfId = Number(args.workflowId);
      const [workflow] = await db
        .select()
        .from(workflowsTable)
        .where(eq(workflowsTable.id, wfId));
      if (!workflow) throw new Error("Workflow not found");

      const [execution] = await db
        .insert(executionsTable)
        .values({
          workflowId: wfId,
          workflowName: workflow.name,
          status: "pending",
          startedAt: new Date(),
          steps: [],
        })
        .returning();

      return serializeExecution(execution);
    },

    cancelExecution: async (_: unknown, args: { id: string }) => {
      const execId = Number(args.id);
      await db
        .update(executionsTable)
        .set({ status: "cancelled", finishedAt: new Date() })
        .where(eq(executionsTable.id, execId));
      return getExecution(execId);
    },
  },

  Subscription: {
    executionUpdated: {
      subscribe: async function* (_: unknown, args: { workflowId?: string }) {
        const eventTarget = new EventTarget();
        const handler = (event: any) => {
          const payload = event.detail;
          if (
            args.workflowId &&
            payload.payload?.workflowId !== Number(args.workflowId)
          )
            return;

          eventTarget.dispatchEvent(
            new CustomEvent("data", {
              detail: {
                executionId: payload.aggregateId,
                workflowId: payload.payload?.workflowId ?? null,
                status: payload.type.replace("execution.", ""),
                timestamp: payload.timestamp,
                message: payload.payload?.error ?? null,
              },
            }),
          );
        };

        realtimeHub.register.length;
        const unsub = () => {};

        try {
          while (true) {
            yield await new Promise((resolve) => {
              const onData = (e: Event) => {
                resolve({ executionUpdated: (e as CustomEvent).detail });
              };
              eventTarget.addEventListener("data", onData, { once: true });
            });
          }
        } finally {
          unsub();
        }
      },
    },
  },
};
