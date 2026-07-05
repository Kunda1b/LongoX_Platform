import { prisma } from "@longox/db/prisma";

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

function toIso(d: unknown): string {
  if (d instanceof Date) return d.toISOString();
  if (d == null) return new Date().toISOString();
  return new Date(d as string).toISOString();
}

export const resolvers = {
  Query: {
    me: async (_p: unknown, _a: unknown, ctx: Record<string, unknown>) => {
      const u = user(ctx);
      const row = (await prisma.user.findUnique({
        where: { id: u.id },
        select: { id: true, email: true, name: true, avatarUrl: true } as any,
      })) as any;
      if (!row) throw new Error("User not found");
      return row;
    },

    tenants: async (_p: unknown, _a: unknown, ctx: Record<string, unknown>) => {
      const u = user(ctx);
      const memberships = (await prisma.membership.findMany({
        where: { userId: u.id },
        include: {
          tenant: {
            select: { id: true, name: true, planId: true, primaryRegion: true },
          },
        } as any,
      })) as any[];
      return memberships
        .filter((m) => m.tenant)
        .map((m) => ({
          id: String(m.tenant.id),
          name: m.tenant.name,
          tier: "SHARED",
          planId: m.tenant.planId,
          region: m.tenant.primaryRegion ?? "us-east-1",
        }));
    },

    workflows: async (
      _p: unknown,
      args: Record<string, unknown>,
      ctx: Record<string, unknown>,
    ) => {
      const u = user(ctx);
      const limit = clamp(args.first as number | null);
      const offset = args.after ? dec(args.after as string) : 0;
      const filter = args.filter as Record<string, unknown> | undefined;
      const where: any = { tenantId: u.tenantId };
      if (filter?.status)
        where.status = (filter.status as string).toLowerCase();
      if (filter?.search)
        where.name = { contains: filter.search as string, mode: "insensitive" };

      const [rows, total] = await Promise.all([
        prisma.workflow.findMany({
          where,
          orderBy: { updatedAt: "desc" },
          take: limit,
          skip: offset,
        }) as Promise<any[]>,
        prisma.workflow.count({ where }),
      ]);

      return {
        edges: rows.map((r) => ({
          node: {
            id: String(r.id),
            tenantId: String(r.tenantId),
            name: r.name,
            status: toGqlStatus(r.status),
            currentVersionId: null,
            tags: [],
          },
          cursor: enc(r.id),
        })),
        pageInfo: pageInfo(rows.length === limit, offset, rows),
        totalCount: total ?? 0,
      };
    },

    workflow: async (
      _p: unknown,
      args: Record<string, unknown>,
      ctx: Record<string, unknown>,
    ) => {
      const u = user(ctx);
      const r = (await prisma.workflow.findFirst({
        where: { id: String(args.id), tenantId: u.tenantId },
      })) as any;
      return r
        ? {
            id: String(r.id),
            tenantId: String(r.tenantId),
            name: r.name,
            status: toGqlStatus(r.status),
            currentVersionId: null,
            tags: [],
          }
        : null;
    },

    executions: async (
      _p: unknown,
      args: Record<string, unknown>,
      ctx: Record<string, unknown>,
    ) => {
      const u = user(ctx);
      const limit = clamp(args.first as number | null);
      const offset = args.after ? dec(args.after as string) : 0;
      const filter = args.filter as Record<string, unknown> | undefined;
      const where: any = { tenantId: u.tenantId };
      if (filter?.workflowId) where.workflowId = String(filter.workflowId);
      if (filter?.status)
        where.status = (filter.status as string).toLowerCase();

      const [rows, total] = await Promise.all([
        prisma.workflowExecution.findMany({
          where,
          orderBy: { startedAt: "desc" },
          take: limit,
          skip: offset,
        }) as Promise<any[]>,
        prisma.workflowExecution.count({ where }),
      ]);

      return {
        edges: rows.map((r) => ({
          node: {
            id: String(r.id),
            workflowVersionId: String(r.workflowId),
            status: toGqlStatus(r.status, "pending"),
            startedAt: toIso(r.startedAt),
            finishedAt: r.finishedAt ? toIso(r.finishedAt) : null,
            stepResults: [],
            checkpoints: [],
          },
          cursor: enc(r.id),
        })),
        pageInfo: pageInfo(rows.length === limit, offset, rows),
        totalCount: total ?? 0,
      };
    },

    execution: async (
      _p: unknown,
      args: Record<string, unknown>,
      ctx: Record<string, unknown>,
    ) => {
      const u = user(ctx);
      const r = (await prisma.workflowExecution.findFirst({
        where: { id: String(args.id), tenantId: u.tenantId },
      })) as any;
      return r
        ? {
            id: String(r.id),
            workflowVersionId: String(r.workflowId),
            status: toGqlStatus(r.status, "pending"),
            startedAt: toIso(r.startedAt),
            finishedAt: r.finishedAt ? toIso(r.finishedAt) : null,
            stepResults: [],
            checkpoints: [],
          }
        : null;
    },

    dashboards: async (
      _p: unknown,
      _a: unknown,
      ctx: Record<string, unknown>,
    ) => {
      const u = user(ctx);
      const rows = (await prisma.dashboard.findMany({
        where: { tenantId: u.tenantId },
        orderBy: { updatedAt: "desc" },
      })) as any[];
      return rows.map((r) => ({
        id: String(r.id),
        tenantId: String(r.tenantId),
        title: (r as any).name ?? r.title,
        status: toGqlStatus(r.status),
        currentVersionId: null,
      }));
    },

    connector: async (_p: unknown, args: Record<string, unknown>) => {
      const r = (await prisma.connector.findUnique({
        where: { id: String(args.id) },
      })) as any;
      if (!r) return null;
      const versions = (await prisma.connectorVersion.findMany({
        where: { connectorId: r.id },
        orderBy: { createdAt: "desc" },
      })) as any[];
      return {
        id: String(r.id),
        slug: r.slug ?? r.name,
        name: r.displayName ?? r.name,
        trustLevel: (
          (r as any).certificationLevel ??
          r.trustLevel ??
          "community"
        ).toUpperCase(),
        versions: versions.map((v) => ({
          id: String(v.id),
          version: v.semver,
          supported: (v as any).isSupported ?? !(v as any).isDeprecated,
        })),
      };
    },

    templates: async (_p: unknown, args: Record<string, unknown>) => {
      const limit = clamp(args.first as number | null);
      const offset = args.after ? dec(args.after as string) : 0;
      const where: any = args.category
        ? { category: args.category as string }
        : {};

      const [rows, total] = await Promise.all([
        prisma.template.findMany({
          where,
          orderBy: { installCount: "desc" } as any,
          take: limit,
          skip: offset,
        }) as Promise<any[]>,
        prisma.template.count({ where }),
      ]);

      return {
        edges: rows.map((r) => ({
          node: {
            id: String(r.id),
            category: r.category,
            visibility: "PUBLIC",
            installCount: (r as any).uses ?? r.installCount,
            versions: [],
          },
          cursor: enc(r.id),
        })),
        pageInfo: pageInfo(rows.length === limit, offset, rows),
        totalCount: total ?? 0,
      };
    },
  },

  Mutation: {
    publishWorkflow: async (
      _p: unknown,
      args: Record<string, unknown>,
      ctx: Record<string, unknown>,
    ) => {
      const u = user(ctx);
      const input = args.input as Record<string, unknown>;
      const wid = String(input.workflowId);
      const wf = (await prisma.workflow.findUnique({
        where: { id: wid },
      })) as any;
      if (!wf) throw new Error("Workflow not found");

      const existing = (await prisma.workflowVersion.findFirst({
        where: { workflowId: wid },
        orderBy: { versionNumber: "desc" },
      })) as any;
      const ver = ((existing?.versionNumber ?? 0) as number) + 1;

      const version = (await prisma.workflowVersion.create({
        data: {
          workflowId: wid,
          versionNumber: ver,
          name: wf.name,
          graphJson: (wf as any).nodes ?? [],
          changeNote: (input.releaseNotes as string) ?? null,
          published: true,
        } as any,
      })) as any;

      return {
        workflowVersion: {
          id: String(version.id),
          versionNumber: ver,
          graph: {
            nodes: Array.isArray((version as any).nodes)
              ? (version as any).nodes
              : Array.isArray(version.graphJson)
                ? version.graphJson
                : [],
            edges: [],
            variables: [],
            policies: [],
          },
          checksum: `${wid}-v${ver}`,
          createdBy: String(u.id),
          publishedAt: toIso(version.createdAt),
        },
        validationResult: { valid: true, errors: [], warnings: [] },
      };
    },

    createDashboard: async (
      _p: unknown,
      args: Record<string, unknown>,
      ctx: Record<string, unknown>,
    ) => {
      const u = user(ctx);
      const input = args.input as Record<string, unknown>;
      const d = (await prisma.dashboard.create({
        data: {
          tenantId: u.tenantId,
          title: input.title as string,
          status: "draft",
        } as any,
      })) as any;
      return {
        dashboard: {
          id: String(d.id),
          tenantId: String(d.tenantId),
          title: (d as any).title ?? d.name,
          status: "DRAFT",
          currentVersionId: null,
        },
      };
    },

    installConnector: async (_p: unknown, args: Record<string, unknown>) => {
      const input = args.input as Record<string, unknown>;
      const r = (await prisma.connector.findUnique({
        where: { id: String(input.connectorId) },
      })) as any;
      if (!r) throw new Error("Connector not found");
      return {
        connector: {
          id: String(r.id),
          slug: r.slug ?? r.name,
          name: r.displayName ?? r.name,
          trustLevel: (
            (r as any).certificationLevel ??
            r.trustLevel ??
            "community"
          ).toUpperCase(),
          versions: [],
        },
        credentials: null,
      };
    },

    promoteEnvironment: async (
      _p: unknown,
      args: Record<string, unknown>,
      ctx: Record<string, unknown>,
    ) => {
      const u = user(ctx);
      const input = args.input as Record<string, unknown>;
      const p = (await prisma.workflowPromotion.create({
        data: {
          workflowId: String(input.workflowId),
          workflowName: `workflow-${String(input.workflowId)}`,
          fromEnvironment: input.sourceEnvironment as string,
          toEnvironment: input.targetEnvironment as string,
          status: "promoted",
          promotedBy: String(u.id),
        } as any,
      })) as any;
      return {
        promotion: {
          id: String(p.id),
          workflowId: String(p.workflowId),
          sourceEnvironment: p.fromEnvironment,
          targetEnvironment: p.toEnvironment,
          versionId: String(input.versionId),
          promotedBy: String(u.id),
          promotedAt: toIso(p.createdAt),
          status: p.status,
        },
      };
    },
  },

  CurrentUser: {
    tenants: async (parent: Record<string, unknown>) => {
      const rows = (await prisma.membership.findMany({
        where: { userId: String(parent.id) },
        select: { tenantId: true, roleId: true, status: true } as any,
      })) as any[];
      return rows.map((r) => ({
        userId: String(parent.id),
        tenantId: String(r.tenantId),
        role: { id: "", name: "member", permissions: [] },
        status: (r.status ?? "active").toUpperCase() as
          | "ACTIVE"
          | "INVITED"
          | "DEACTIVATED",
      }));
    },
  },

  Tenant: {
    memberships: async (parent: Record<string, unknown>) => {
      const rows = (await prisma.membership.findMany({
        where: { tenantId: String(parent.id) },
      })) as any[];
      return rows.map((r) => ({
        userId: String(r.userId),
        tenantId: String(r.tenantId),
        role: { id: "", name: "member", permissions: [] },
        status: (r.status ?? "active").toUpperCase() as
          | "ACTIVE"
          | "INVITED"
          | "DEACTIVATED",
      }));
    },
  },

  Workflow: {
    currentVersion: async (parent: Record<string, unknown>) => {
      const v = (await prisma.workflowVersion.findFirst({
        where: { workflowId: String(parent.id) },
        orderBy: { versionNumber: "desc" },
      })) as any;
      return v
        ? {
            id: String(v.id),
            versionNumber: v.versionNumber,
            graph: {
              nodes: Array.isArray((v as any).nodes)
                ? (v as any).nodes
                : Array.isArray(v.graphJson)
                  ? v.graphJson
                  : [],
              edges: [],
              variables: [],
              policies: [],
            },
            checksum: `${String(parent.id)}-v${v.versionNumber}`,
            createdBy: String(v.workflowId),
            publishedAt: toIso(v.createdAt),
          }
        : null;
    },
    versions: async (
      parent: Record<string, unknown>,
      args: Record<string, unknown>,
    ) => {
      const limit = clamp(args.first as number | null);
      const rows = (await prisma.workflowVersion.findMany({
        where: { workflowId: String(parent.id) },
        orderBy: { versionNumber: "desc" },
        take: limit,
      })) as any[];
      return {
        edges: rows.map((v) => ({
          node: {
            id: String(v.id),
            versionNumber: v.versionNumber,
            graph: {
              nodes: Array.isArray((v as any).nodes)
                ? (v as any).nodes
                : Array.isArray(v.graphJson)
                  ? v.graphJson
                  : [],
              edges: [],
              variables: [],
              policies: [],
            },
            checksum: `${String(parent.id)}-v${v.versionNumber}`,
            createdBy: String(v.workflowId),
            publishedAt: toIso(v.createdAt),
          },
          cursor: enc(v.id),
        })),
        pageInfo: {
          hasNextPage: rows.length === limit,
          hasPreviousPage: false,
          startCursor: rows.length > 0 ? enc(rows[0].id) : null,
          endCursor: rows.length > 0 ? enc(rows[rows.length - 1].id) : null,
        },
      };
    },
  },

  Dashboard: {
    currentVersion: async (parent: Record<string, unknown>) => {
      const v = (await prisma.dashboardVersion.findFirst({
        where: { dashboardId: String(parent.id) },
        orderBy: { versionNumber: "desc" },
      })) as any;
      return v
        ? {
            id: String(v.id),
            versionNumber: v.versionNumber,
            layout: v.layoutJson,
            widgets: [],
            checksum: v.checksum ?? "",
          }
        : null;
    },
  },

  Template: {
    versions: async (parent: Record<string, unknown>) => {
      const rows = (await prisma.templateVersion.findMany({
        where: { templateId: String(parent.id) },
        orderBy: { createdAt: "desc" },
      })) as any[];
      return rows.map((v) => ({
        id: String(v.id),
        versionNumber: (v as any).version ?? v.versionNumber ?? 1,
        templateId: String(v.templateId),
        createdAt: toIso(v.createdAt),
      }));
    },
  },
};
