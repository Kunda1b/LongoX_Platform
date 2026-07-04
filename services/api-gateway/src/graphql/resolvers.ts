import { eq, and, like, desc, count, sql } from "drizzle-orm";
import { db } from "@longox/db";
import {
  tenantsTable,
  usersTable,
  membershipsTable,
  workflowsTable,
  workflowVersionsTable,
  executionsTable,
  dashboardsTable,
  dashboardVersionsTable,
  connectorsTable,
  connectorVersionsTable,
  templatesTable,
  templateVersionsTable,
  workflowPromotionsTable,
} from "@longox/db";

interface AppUser {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  role: string;
}

function clamp(n: number | null | undefined): number {
  return Math.min(Math.max(n ?? 20, 1), 100);
}

const enc = (id: string) => Buffer.from(String(id)).toString("base64");
const dec = (c: string) => Number(Buffer.from(c, "base64").toString());

function pageInfo(hasNext: boolean, offset: number, items: { id: string }[]) {
  return {
    hasNextPage: hasNext,
    hasPreviousPage: offset > 0,
    startCursor: items.length > 0 ? enc(items[0].id) : null,
    endCursor: items.length > 0 ? enc(items[items.length - 1].id) : null,
  };
}

function user(ctx: Record<string, unknown>): AppUser {
  const u = ctx.user as AppUser | undefined;
  if (!u) throw new Error("Not authenticated");
  return u;
}

function toGqlStatus(s: string | null | undefined, def = "draft"): string {
  return (s ?? def).toUpperCase();
}

export const resolvers = {
  Query: {
    me: async (_p: unknown, _a: unknown, ctx: Record<string, unknown>) => {
      const u = user(ctx);
      const [row] = await db
        .select({ id: usersTable.id, email: usersTable.email, name: usersTable.name, avatarUrl: usersTable.avatarUrl })
        .from(usersTable).where(eq(usersTable.id, u.id));
      if (!row) throw new Error("User not found");
      return row;
    },

    tenants: async (_p: unknown, _a: unknown, ctx: Record<string, unknown>) => {
      const u = user(ctx);
      const rows = await db
        .select({ id: tenantsTable.id, name: tenantsTable.name, plan: tenantsTable.plan, region: tenantsTable.primaryRegion })
        .from(tenantsTable)
        .innerJoin(membershipsTable, eq(membershipsTable.tenantId, tenantsTable.id))
        .where(eq(membershipsTable.userId, u.id));
      return rows.map((r) => ({ id: String(r.id), name: r.name, tier: "SHARED", planId: r.plan, region: r.region ?? "us-east-1" }));
    },

    workflows: async (_p: unknown, args: Record<string, unknown>, ctx: Record<string, unknown>) => {
      const u = user(ctx);
      const limit = clamp(args.first as number | null);
      const offset = args.after ? dec(args.after as string) : 0;
      const filter = args.filter as Record<string, unknown> | undefined;
      const conds = [eq(workflowsTable.tenantId, u.tenantId)];
      if (filter?.status) conds.push(eq(workflowsTable.status, (filter.status as string).toLowerCase()));
      if (filter?.search) conds.push(like(workflowsTable.name, `%${filter.search as string}%`));

      const rows = await db.select().from(workflowsTable).where(and(...conds)).orderBy(desc(workflowsTable.updatedAt)).limit(limit).offset(offset);
      const [{ total }] = await db.select({ total: count() }).from(workflowsTable).where(and(...conds));

      return {
        edges: rows.map((r) => ({ node: { id: String(r.id), tenantId: String(r.tenantId), name: r.name, status: toGqlStatus(r.status), currentVersionId: null, tags: [] }, cursor: enc(r.id) })),
        pageInfo: pageInfo(rows.length === limit, offset, rows),
        totalCount: total ?? 0,
      };
    },

    workflow: async (_p: unknown, args: Record<string, unknown>, ctx: Record<string, unknown>) => {
      const u = user(ctx);
      const [r] = await db.select().from(workflowsTable).where(and(eq(workflowsTable.id, String(args.id)), eq(workflowsTable.tenantId, u.tenantId)));
      return r ? { id: String(r.id), tenantId: String(r.tenantId), name: r.name, status: toGqlStatus(r.status), currentVersionId: null, tags: [] } : null;
    },

    executions: async (_p: unknown, args: Record<string, unknown>, ctx: Record<string, unknown>) => {
      const u = user(ctx);
      const limit = clamp(args.first as number | null);
      const offset = args.after ? dec(args.after as string) : 0;
      const filter = args.filter as Record<string, unknown> | undefined;
      const conds = [eq(executionsTable.tenantId, u.tenantId)];
      if (filter?.workflowId) conds.push(eq(executionsTable.workflowId, String(filter.workflowId)));
      if (filter?.status) conds.push(eq(executionsTable.status, (filter.status as string).toLowerCase()));

      const rows = await db.select().from(executionsTable).where(and(...conds)).orderBy(desc(executionsTable.startedAt)).limit(limit).offset(offset);
      const [{ total }] = await db.select({ total: count() }).from(executionsTable).where(and(...conds));

      return {
        edges: rows.map((r) => ({ node: { id: String(r.id), workflowVersionId: String(r.workflowId), status: toGqlStatus(r.status, "pending"), startedAt: r.startedAt.toISOString(), finishedAt: r.finishedAt?.toISOString() ?? null, stepResults: [], checkpoints: [] }, cursor: enc(r.id) })),
        pageInfo: pageInfo(rows.length === limit, offset, rows),
        totalCount: total ?? 0,
      };
    },

    execution: async (_p: unknown, args: Record<string, unknown>, ctx: Record<string, unknown>) => {
      const u = user(ctx);
      const [r] = await db.select().from(executionsTable).where(and(eq(executionsTable.id, String(args.id)), eq(executionsTable.tenantId, u.tenantId)));
      return r ? { id: String(r.id), workflowVersionId: String(r.workflowId), status: toGqlStatus(r.status, "pending"), startedAt: r.startedAt.toISOString(), finishedAt: r.finishedAt?.toISOString() ?? null, stepResults: [], checkpoints: [] } : null;
    },

    dashboards: async (_p: unknown, _a: unknown, ctx: Record<string, unknown>) => {
      const u = user(ctx);
      const rows = await db.select().from(dashboardsTable).where(eq(dashboardsTable.tenantId, u.tenantId)).orderBy(desc(dashboardsTable.updatedAt));
      return rows.map((r) => ({ id: String(r.id), tenantId: String(r.tenantId), title: r.name, status: toGqlStatus(r.status), currentVersionId: null }));
    },

    connector: async (_p: unknown, args: Record<string, unknown>) => {
      const [r] = await db.select().from(connectorsTable).where(eq(connectorsTable.id, String(args.id)));
      if (!r) return null;
      const versions = await db.select().from(connectorVersionsTable).where(eq(connectorVersionsTable.connectorId, r.id)).orderBy(desc(connectorVersionsTable.createdAt));
      return { id: String(r.id), slug: r.name, name: r.displayName ?? r.name, trustLevel: (r.certificationLevel ?? "community").toUpperCase(), versions: versions.map((v) => ({ id: String(v.id), version: v.semver, supported: !v.isDeprecated })) };
    },

    templates: async (_p: unknown, args: Record<string, unknown>) => {
      const limit = clamp(args.first as number | null);
      const offset = args.after ? dec(args.after as string) : 0;
      const conds = args.category ? [eq(templatesTable.category, args.category as string)] : [];

      const rows = await db.select().from(templatesTable).where(conds.length ? and(...conds) : undefined).orderBy(desc(templatesTable.uses)).limit(limit).offset(offset);
      const [{ total }] = await db.select({ total: count() }).from(templatesTable).where(conds.length ? and(...conds) : undefined);

      return {
        edges: rows.map((r) => ({ node: { id: String(r.id), category: r.category, visibility: "PUBLIC", installCount: r.uses, versions: [] }, cursor: enc(r.id) })),
        pageInfo: pageInfo(rows.length === limit, offset, rows),
        totalCount: total ?? 0,
      };
    },
  },

  Mutation: {
    publishWorkflow: async (_p: unknown, args: Record<string, unknown>, ctx: Record<string, unknown>) => {
      const u = user(ctx);
      const input = args.input as Record<string, unknown>;
      const wid = String(input.workflowId);
      const [wf] = await db.select().from(workflowsTable).where(eq(workflowsTable.id, wid));
      if (!wf) throw new Error("Workflow not found");

      const [existing] = await db.select({ mv: sql<number>`COALESCE(MAX(version), 0)` }).from(workflowVersionsTable).where(eq(workflowVersionsTable.workflowId, wid));
      const ver = (existing?.mv ?? 0) + 1;

      const [version] = await db.insert(workflowVersionsTable).values({ workflowId: wid, version: ver, name: wf.name, nodes: wf.nodes ?? [], changeNote: (input.releaseNotes as string) ?? null, published: true }).returning();

      return {
        workflowVersion: { id: String(version.id), versionNumber: version.version, graph: { nodes: Array.isArray(version.nodes) ? version.nodes : [], edges: [], variables: [], policies: [] }, checksum: `${wid}-v${ver}`, createdBy: String(u.id), publishedAt: version.createdAt.toISOString() },
        validationResult: { valid: true, errors: [], warnings: [] },
      };
    },

    createDashboard: async (_p: unknown, args: Record<string, unknown>, ctx: Record<string, unknown>) => {
      const u = user(ctx);
      const input = args.input as Record<string, unknown>;
      const [d] = await db.insert(dashboardsTable).values({ tenantId: u.tenantId, name: input.title as string, status: "draft" }).returning();
      return { dashboard: { id: String(d.id), tenantId: String(d.tenantId), title: d.name, status: "DRAFT", currentVersionId: null } };
    },

    installConnector: async (_p: unknown, args: Record<string, unknown>) => {
      const input = args.input as Record<string, unknown>;
      const [r] = await db.select().from(connectorsTable).where(eq(connectorsTable.id, String(input.connectorId)));
      if (!r) throw new Error("Connector not found");
      return { connector: { id: String(r.id), slug: r.name, name: r.displayName ?? r.name, trustLevel: (r.certificationLevel ?? "community").toUpperCase(), versions: [] }, credentials: null };
    },

    promoteEnvironment: async (_p: unknown, args: Record<string, unknown>, ctx: Record<string, unknown>) => {
      const u = user(ctx);
      const input = args.input as Record<string, unknown>;
      const [p] = await db.insert(workflowPromotionsTable).values({ workflowId: String(input.workflowId), workflowName: `workflow-${String(input.workflowId)}`, fromEnvironment: input.sourceEnvironment as string, toEnvironment: input.targetEnvironment as string, status: "promoted", promotedBy: String(u.id) }).returning();
      return { promotion: { id: String(p.id), workflowId: String(p.workflowId), sourceEnvironment: p.fromEnvironment, targetEnvironment: p.toEnvironment, versionId: String(input.versionId), promotedBy: String(u.id), promotedAt: p.createdAt.toISOString(), status: p.status } };
    },
  },

  CurrentUser: {
    tenants: async (parent: Record<string, unknown>) => {
      const rows = await db
        .select({ tenantId: membershipsTable.tenantId, roleId: membershipsTable.roleId, status: membershipsTable.status })
        .from(membershipsTable).where(eq(membershipsTable.userId, String(parent.id)));
      return rows.map((r) => ({ userId: String(parent.id), tenantId: String(r.tenantId), role: { id: "", name: "member", permissions: [] }, status: (r.status ?? "active").toUpperCase() as "ACTIVE" | "INVITED" | "DEACTIVATED" }));
    },
  },

  Tenant: {
    memberships: async (parent: Record<string, unknown>) => {
      const rows = await db.select().from(membershipsTable).where(eq(membershipsTable.tenantId, String(parent.id)));
      return rows.map((r) => ({ userId: String(r.userId), tenantId: String(r.tenantId), role: { id: "", name: "member", permissions: [] }, status: (r.status ?? "active").toUpperCase() as "ACTIVE" | "INVITED" | "DEACTIVATED" }));
    },
  },

  Workflow: {
    currentVersion: async (parent: Record<string, unknown>) => {
      const [v] = await db.select().from(workflowVersionsTable).where(eq(workflowVersionsTable.workflowId, String(parent.id))).orderBy(desc(workflowVersionsTable.version)).limit(1);
      return v ? { id: String(v.id), versionNumber: v.version, graph: { nodes: Array.isArray(v.nodes) ? v.nodes : [], edges: [], variables: [], policies: [] }, checksum: `${String(parent.id)}-v${v.version}`, createdBy: String(v.workflowId), publishedAt: v.createdAt.toISOString() } : null;
    },
    versions: async (parent: Record<string, unknown>, args: Record<string, unknown>) => {
      const limit = clamp(args.first as number | null);
      const rows = await db.select().from(workflowVersionsTable).where(eq(workflowVersionsTable.workflowId, String(parent.id))).orderBy(desc(workflowVersionsTable.version)).limit(limit);
      return {
        edges: rows.map((v) => ({ node: { id: String(v.id), versionNumber: v.version, graph: { nodes: Array.isArray(v.nodes) ? v.nodes : [], edges: [], variables: [], policies: [] }, checksum: `${String(parent.id)}-v${v.version}`, createdBy: String(v.workflowId), publishedAt: v.createdAt.toISOString() }, cursor: enc(v.id) })),
        pageInfo: { hasNextPage: rows.length === limit, hasPreviousPage: false, startCursor: rows.length > 0 ? enc(rows[0].id) : null, endCursor: rows.length > 0 ? enc(rows[rows.length - 1].id) : null },
      };
    },
  },

  Dashboard: {
    currentVersion: async (parent: Record<string, unknown>) => {
      const [v] = await db.select().from(dashboardVersionsTable).where(eq(dashboardVersionsTable.dashboardId, String(parent.id))).orderBy(desc(dashboardVersionsTable.versionNumber)).limit(1);
      return v ? { id: String(v.id), versionNumber: v.versionNumber, layout: v.layoutJson, widgets: [], checksum: v.checksum ?? "" } : null;
    },
  },

  Template: {
    versions: async (parent: Record<string, unknown>) => {
      const rows = await db.select().from(templateVersionsTable).where(eq(templateVersionsTable.templateId, String(parent.id))).orderBy(desc(templateVersionsTable.createdAt));
      return rows.map((v) => ({ id: String(v.id), versionNumber: v.version, templateId: String(v.templateId), createdAt: v.createdAt.toISOString() }));
    },
  },
};
