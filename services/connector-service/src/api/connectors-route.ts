/**
 * Connector REST routes.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.connector`, `prisma.connectorAction`, `prisma.connectorTrigger`,
 * `prisma.connectorVersion`, and `prisma.tenantConnectorInstall` delegates
 * with `as any` casts for legacy columns not reflected on the Prisma models.
 */

import { Router, type IRouter } from "express";
import { prisma } from "@longox/db/prisma";
import { authorize, requireTenantContext } from "@longox/shared-rbac";
import { PostgresConnectorRepository } from "../infrastructure/postgres-connector-repository";
import {
  InstallConnectorCommand,
  ConfigureConnectorCommand,
  UpgradeConnectorCommand,
  RemoveConnectorCommand,
  SandboxExecutionService,
} from "../application";

const router: IRouter = Router();
const connectorRepo = new PostgresConnectorRepository();
const installCommand = new InstallConnectorCommand(connectorRepo);
const configureCommand = new ConfigureConnectorCommand(connectorRepo);
const upgradeCommand = new UpgradeConnectorCommand(connectorRepo);
const removeCommand = new RemoveConnectorCommand();
const sandboxExecutionService = new SandboxExecutionService();

function serializeConnector(row: any) {
  return {
    id: row.id,
    name: row.name,
    displayName: row.displayName ?? null,
    version: row.version,
    category: row.category,
    description: row.description,
    icon: row.icon,
    color: row.color ?? null,
    author: row.author ?? null,
    certificationLevel: row.certificationLevel,
    authType: row.authType,
    authConfig: row.authConfig ?? {},
    capabilities: row.capabilities ?? {},
    rateLimit: row.rateLimit ?? null,
    healthStatus: row.healthStatus ?? {},
    isFeatured: row.isFeatured,
    actionCount: row.actionCount,
    triggerCount: row.triggerCount,
    installCount: row.installCount,
    rating: row.rating ?? null,
    status: row.status,
  };
}

router.get(
  "/connectors/marketplace",
  authorize({ resource: "connectors", action: "read" }),
  async (req, res): Promise<void> => {
    const where: Record<string, unknown> = { status: "active" };
    if (req.query.category) {
      where.category = String(req.query.category);
    }
    if (req.query.search) {
      const s = String(req.query.search);
      where.OR = [
        { name: { contains: s, mode: "insensitive" } },
        { displayName: { contains: s, mode: "insensitive" } },
        { description: { contains: s, mode: "insensitive" } },
      ];
    }
    if (req.query.certificationLevel) {
      where.certificationLevel = String(req.query.certificationLevel);
    }

    const rows = await prisma.connector.findMany({
      where: where as any,
      orderBy: [{ isFeatured: "desc" } as any, { name: "asc" }],
    });

    res.json(rows.map(serializeConnector));
  },
);

router.get(
  "/connectors/:id/actions",
  authorize({ resource: "connectors", action: "read" }),
  async (req, res): Promise<void> => {
    const id = String(req.params.id);
    const actions = await prisma.connectorAction.findMany({
      where: { connectorId: id } as any,
    });
    res.json(actions);
  },
);

router.get(
  "/connectors/:id/triggers",
  authorize({ resource: "connectors", action: "read" }),
  async (req, res): Promise<void> => {
    const id = String(req.params.id);
    const triggers = await prisma.connectorTrigger.findMany({
      where: { connectorId: id } as any,
    });
    res.json(triggers);
  },
);

router.get(
  "/connectors/installations",
  authorize({ resource: "connectors", action: "read" }),
  requireTenantContext,
  async (req, res): Promise<void> => {
    const tenantId = req.user!.tenantId!;
    const installations = await prisma.tenantConnectorInstall.findMany({
      where: { tenantId } as any,
      orderBy: { createdAt: "desc" } as any,
      include: { connector: true } as any,
    });

    res.json(
      installations.map((inst: any) => {
        const connector = inst.connector ?? {};
        return {
          id: inst.id,
          connectorId: connector.id ?? inst.connectorId,
          connectorName: connector.displayName ?? connector.name ?? "Unknown",
          version: connector.version ?? "",
          status: inst.status,
          config: inst.config ?? {},
          installedAt: inst.createdAt ?? inst.installedAt,
          lastUsedAt: inst.lastUsedAt ?? null,
        };
      }),
    );
  },
);

router.post(
  "/connectors/:id/install",
  authorize({ resource: "connectors", action: "install" }),
  requireTenantContext,
  async (req, res): Promise<void> => {
    const connectorId = String(req.params.id);
    const tenantId = req.user!.tenantId!;
    const userId = req.user!.id;
    const config = (req.body.config ?? {}) as Record<string, unknown>;

    try {
      const installation = await installCommand.execute({
        tenantId,
        connectorId,
        config,
        installedBy: userId as any,
        connectorVersionId: req.body.connectorVersionId,
      });

      // Atomic increment of legacy `install_count` column on the connector row.
      await prisma.$executeRawUnsafe(
        `UPDATE connectors SET install_count = install_count + 1 WHERE id = $1`,
        connectorId,
      );

      res.status(201).json(installation.toJSON());
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  },
);

router.post(
  "/connectors/installations/:installationId/configure",
  authorize({ resource: "connectors", action: "write" }),
  requireTenantContext,
  async (req, res): Promise<void> => {
    const installationId = String(req.params.installationId);
    const tenantId = req.user!.tenantId!;
    const config = (req.body.config ?? {}) as Record<string, unknown>;

    try {
      const installation = await configureCommand.execute({
        tenantId,
        installationId,
        config,
      });
      res.json(installation.toJSON());
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  },
);

router.post(
  "/connectors/installations/:installationId/upgrade",
  authorize({ resource: "connectors", action: "install" }),
  requireTenantContext,
  async (req, res): Promise<void> => {
    const installationId = String(req.params.installationId);
    const tenantId = req.user!.tenantId!;
    const newVersionId = String(req.body.connectorVersionId);

    if (!newVersionId) {
      res.status(400).json({ error: "connectorVersionId is required" });
      return;
    }

    try {
      const installation = await upgradeCommand.execute({
        tenantId,
        installationId,
        newVersionId,
      });
      res.json(installation.toJSON());
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  },
);

router.get(
  "/connectors/:id/versions",
  authorize({ resource: "connectors", action: "read" }),
  async (req, res): Promise<void> => {
    const connectorId = String(req.params.id);
    const versions = await prisma.connectorVersion.findMany({
      where: { connectorId } as any,
      orderBy: { createdAt: "desc" },
    });
    res.json(versions);
  },
);

router.delete(
  "/connectors/installations/:installationId",
  authorize({ resource: "connectors", action: "install" }),
  requireTenantContext,
  async (req, res): Promise<void> => {
    const installationId = String(req.params.installationId);
    const tenantId = req.user!.tenantId!;

    try {
      await removeCommand.execute({ tenantId, installationId });
      res.status(204).end();
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  },
);

// ─── Test Connection (sandboxed) ─────────────────────────────────────────────

router.post(
  "/connectors/installations/:installationId/test",
  authorize({ resource: "connectors", action: "read" }),
  requireTenantContext,
  async (req, res): Promise<void> => {
    const installationId = String(req.params.installationId);
    const tenantId = req.user!.tenantId!;

    try {
      const install = await prisma.tenantConnectorInstall.findFirst({
        where: {
          id: installationId,
          tenantId,
        } as any,
      });

      if (!install) {
        res.status(404).json({ error: "Installation not found" });
        return;
      }

      const connector = await prisma.connector.findUnique({
        where: { id: (install as any).connectorId },
      });

      const capabilities = (connector as any)?.capabilities as
        | Record<string, unknown>
        | undefined;
      const manifestJson = capabilities?.manifest as string | undefined;
      const manifest = manifestJson ? JSON.parse(manifestJson) : undefined;

      const result = await sandboxExecutionService.execute({
        connectorName: connector?.name ?? "unknown",
        connectorId: connector?.id ?? "",
        installationId,
        tenantId,
        actionId: "test",
        auth:
          (((install as any).config as Record<string, unknown>)?.auth as Record<
            string,
            unknown
          >) ?? {},
        config: ((install as any).config as Record<string, unknown>) ?? {},
        input: {},
        secrets: {},
        manifest,
      });

      await prisma.tenantConnectorInstall
        .update({
          where: { id: installationId } as any,
          data: { lastUsedAt: new Date() } as any,
        })
        .catch(() => undefined);

      res.json({
        status: result.success ? "success" : "failed",
        durationMs: result.durationMs,
        message: result.success
          ? "Connection successful"
          : (result.error ?? "Connection failed"),
      });
    } catch (err) {
      res.json({
        status: "failed",
        durationMs: 0,
        message: (err as Error).message,
      });
    }
  },
);

// ─── Execute Action (sandboxed) ──────────────────────────────────────────────

router.post(
  "/connectors/installations/:installationId/execute",
  authorize({ resource: "connectors", action: "execute" }),
  requireTenantContext,
  async (req, res): Promise<void> => {
    const installationId = String(req.params.installationId);
    const tenantId = req.user!.tenantId!;
    const actionId = String(req.body.actionId ?? "");
    const input = (req.body.input ?? {}) as Record<string, unknown>;

    if (!actionId) {
      res.status(400).json({ error: "actionId is required" });
      return;
    }

    try {
      const install = await prisma.tenantConnectorInstall.findFirst({
        where: {
          id: installationId,
          tenantId,
        } as any,
      });

      if (!install) {
        res.status(404).json({ error: "Installation not found" });
        return;
      }

      const connector = await prisma.connector.findUnique({
        where: { id: (install as any).connectorId },
      });

      const capabilities = (connector as any)?.capabilities as
        | Record<string, unknown>
        | undefined;
      const manifestJson = capabilities?.manifest as string | undefined;
      const manifest = manifestJson ? JSON.parse(manifestJson) : undefined;

      const result = await sandboxExecutionService.execute({
        connectorName: connector?.name ?? "unknown",
        connectorId: connector?.id ?? "",
        installationId,
        tenantId,
        actionId,
        auth:
          (((install as any).config as Record<string, unknown>)?.auth as Record<
            string,
            unknown
          >) ?? {},
        config: ((install as any).config as Record<string, unknown>) ?? {},
        input,
        secrets: {},
        manifest,
      });

      await prisma.tenantConnectorInstall
        .update({
          where: { id: installationId } as any,
          data: { lastUsedAt: new Date() } as any,
        })
        .catch(() => undefined);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
          durationMs: result.durationMs,
        });
        return;
      }

      res.json({
        success: true,
        data: result.data,
        durationMs: result.durationMs,
        trustTier: result.trustTier,
      });
    } catch (err) {
      res
        .status(500)
        .json({ success: false, error: (err as Error).message, durationMs: 0 });
    }
  },
);

// ─── Register Webhook ─────────────────────────────────────────────────────────

router.post(
  "/connectors/installations/:installationId/webhooks",
  authorize({ resource: "connectors", action: "webhook" }),
  requireTenantContext,
  async (req, res): Promise<void> => {
    const installationId = String(req.params.installationId);
    const tenantId = req.user!.tenantId!;
    const triggerId = String(req.body.triggerId ?? "");
    const webhookUrl = String(req.body.webhookUrl ?? "");
    const eventTypes = (req.body.eventTypes ?? []) as string[];

    if (!triggerId || !webhookUrl) {
      res.status(400).json({ error: "triggerId and webhookUrl are required" });
      return;
    }

    try {
      const install = await prisma.tenantConnectorInstall.findFirst({
        where: {
          id: installationId,
          tenantId,
        } as any,
      });

      if (!install) {
        res.status(404).json({ error: "Installation not found" });
        return;
      }

      res.status(201).json({
        id: `wh-${Date.now()}`,
        installationId,
        triggerId,
        webhookUrl,
        eventTypes,
        status: "registered",
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  },
);

// ─── Poll Trigger ─────────────────────────────────────────────────────────────

router.post(
  "/connectors/installations/:installationId/poll",
  authorize({ resource: "connectors", action: "execute" }),
  requireTenantContext,
  async (req, res): Promise<void> => {
    const installationId = String(req.params.installationId);
    const tenantId = req.user!.tenantId!;
    const triggerId = String(req.body.triggerId ?? "");
    const lastPollId = String(req.body.lastPollId ?? "");

    if (!triggerId) {
      res.status(400).json({ error: "triggerId is required" });
      return;
    }

    try {
      const install = await prisma.tenantConnectorInstall.findFirst({
        where: {
          id: installationId,
          tenantId,
        } as any,
      });

      if (!install) {
        res.status(404).json({ error: "Installation not found" });
        return;
      }

      const connector = await prisma.connector.findUnique({
        where: { id: (install as any).connectorId },
      });

      const capabilities = (connector as any)?.capabilities as
        | Record<string, unknown>
        | undefined;
      const manifestJson = capabilities?.manifest as string | undefined;
      const manifest = manifestJson ? JSON.parse(manifestJson) : undefined;

      const result = await sandboxExecutionService.execute({
        connectorName: connector?.name ?? "unknown",
        connectorId: connector?.id ?? "",
        installationId,
        tenantId,
        actionId: `poll:${triggerId}`,
        auth:
          (((install as any).config as Record<string, unknown>)?.auth as Record<
            string,
            unknown
          >) ?? {},
        config: ((install as any).config as Record<string, unknown>) ?? {},
        input: { lastPollId },
        secrets: {},
        manifest,
      });

      if (!result.success) {
        res
          .status(400)
          .json({ events: [], error: result.error ?? "Poll failed" });
        return;
      }

      res.json({
        events: Array.isArray(result.data?.events) ? result.data.events : [],
        triggerId,
      });
    } catch (err) {
      res.status(500).json({ events: [], error: (err as Error).message });
    }
  },
);

// ─── Rollback ─────────────────────────────────────────────────────────────────

router.post(
  "/connectors/installations/:installationId/rollback",
  authorize({ resource: "connectors", action: "install" }),
  requireTenantContext,
  async (req, res): Promise<void> => {
    const installationId = String(req.params.installationId);
    const tenantId = req.user!.tenantId!;

    try {
      const install = await prisma.tenantConnectorInstall.findFirst({
        where: {
          id: installationId,
          tenantId,
        } as any,
      });

      if (!install) {
        res.status(404).json({ error: "Installation not found" });
        return;
      }

      // Find the second-most-recent non-deprecated version (the previous one).
      const versions = await prisma.connectorVersion.findMany({
        where: {
          connectorId: (install as any).connectorId,
          isDeprecated: false,
        } as any,
        orderBy: { createdAt: "desc" },
        take: 2,
        skip: 1,
      });

      const previousVersion = versions[0];

      if (!previousVersion) {
        res
          .status(400)
          .json({ error: "No previous version available for rollback" });
        return;
      }

      await prisma.tenantConnectorInstall.update({
        where: { id: installationId } as any,
        data: {
          connectorVersionId: previousVersion.id,
          status: "active",
        } as any,
      });

      res.json({
        message: "Rollback successful",
        previousVersionId: previousVersion.id,
        version: (previousVersion as any).semver,
      });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  },
);

export default router;
