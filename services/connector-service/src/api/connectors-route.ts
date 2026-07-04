import { Router, type IRouter } from "express";
import { and, desc, eq, like, or, sql } from "drizzle-orm";
import {
  connectorActionsTable,
  connectorTriggersTable,
  connectorVersionsTable,
  connectorsTable,
  db,
  tenantConnectorInstallsTable,
} from "@longox/db";
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

function serializeConnector(row: typeof connectorsTable.$inferSelect) {
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
    const conditions = [eq(connectorsTable.status, "active")];
    if (req.query.category) {
      conditions.push(
        eq(connectorsTable.category, String(req.query.category)),
      );
    }
    if (req.query.search) {
      const pattern = `%${String(req.query.search)}%`;
      conditions.push(
        or(
          like(connectorsTable.name, pattern),
          like(connectorsTable.displayName, pattern),
          like(connectorsTable.description, pattern),
        )!,
      );
    }
    if (req.query.certificationLevel) {
      conditions.push(
        eq(
          connectorsTable.certificationLevel,
          String(req.query.certificationLevel),
        ),
      );
    }

    const rows = await db
      .select()
      .from(connectorsTable)
      .where(and(...conditions))
      .orderBy(desc(connectorsTable.isFeatured), connectorsTable.name);

    res.json(rows.map(serializeConnector));
  },
);

router.get(
  "/connectors/:id/actions",
  authorize({ resource: "connectors", action: "read" }),
  async (req, res): Promise<void> => {
    const id = String(req.params.id);
    const actions = await db
      .select()
      .from(connectorActionsTable)
      .where(eq(connectorActionsTable.connectorId, id));
    res.json(actions);
  },
);

router.get(
  "/connectors/:id/triggers",
  authorize({ resource: "connectors", action: "read" }),
  async (req, res): Promise<void> => {
    const id = String(req.params.id);
    const triggers = await db
      .select()
      .from(connectorTriggersTable)
      .where(eq(connectorTriggersTable.connectorId, id));
    res.json(triggers);
  },
);

router.get(
  "/connectors/installations",
  authorize({ resource: "connectors", action: "read" }),
  requireTenantContext,
  async (req, res): Promise<void> => {
    const tenantId = req.user!.tenantId!;
    const rows = await db
      .select({
        installation: tenantConnectorInstallsTable,
        connector: connectorsTable,
      })
      .from(tenantConnectorInstallsTable)
      .innerJoin(
        connectorsTable,
        eq(tenantConnectorInstallsTable.connectorId, connectorsTable.id),
      )
      .where(eq(tenantConnectorInstallsTable.tenantId, tenantId))
      .orderBy(desc(tenantConnectorInstallsTable.createdAt));

    res.json(
      rows.map(({ installation, connector }) => ({
        id: installation.id,
        connectorId: connector.id,
        connectorName: connector.displayName ?? connector.name,
        version: connector.version,
        status: installation.status,
        config: installation.config ?? {},
        installedAt: installation.createdAt,
        lastUsedAt: installation.lastUsedAt,
      })),
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

      await db
        .update(connectorsTable)
        .set({
          installCount: sql`${connectorsTable.installCount} + 1`,
        })
        .where(eq(connectorsTable.id, connectorId));

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
    const versions = await db
      .select()
      .from(connectorVersionsTable)
      .where(eq(connectorVersionsTable.connectorId, connectorId))
      .orderBy(desc(connectorVersionsTable.createdAt));
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
      const [install] = await db
        .select()
        .from(tenantConnectorInstallsTable)
        .where(
          and(
            eq(tenantConnectorInstallsTable.id, installationId),
            eq(tenantConnectorInstallsTable.tenantId, tenantId),
          ),
        )
        .limit(1);

      if (!install) {
        res.status(404).json({ error: "Installation not found" });
        return;
      }

      const [connector] = await db
        .select()
        .from(connectorsTable)
        .where(eq(connectorsTable.id, install.connectorId))
        .limit(1);

      const manifestJson = (connector?.capabilities as Record<string, unknown>)?.manifest as string | undefined;
      const manifest = manifestJson ? JSON.parse(manifestJson) : undefined;

      const result = await sandboxExecutionService.execute({
        connectorName: connector?.name ?? "unknown",
        connectorId: connector?.id ?? "",
        installationId,
        tenantId,
        actionId: "test",
        auth: (install.config as Record<string, unknown>)?.auth as Record<string, unknown> ?? {},
        config: install.config as Record<string, unknown> ?? {},
        input: {},
        secrets: {},
        manifest,
      });

      await db
        .update(tenantConnectorInstallsTable)
        .set({ lastUsedAt: new Date() })
        .where(eq(tenantConnectorInstallsTable.id, installationId));

      res.json({
        status: result.success ? "success" : "failed",
        durationMs: result.durationMs,
        message: result.success ? "Connection successful" : (result.error ?? "Connection failed"),
      });
    } catch (err) {
      res.json({ status: "failed", durationMs: 0, message: (err as Error).message });
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
      const [install] = await db
        .select()
        .from(tenantConnectorInstallsTable)
        .where(
          and(
            eq(tenantConnectorInstallsTable.id, installationId),
            eq(tenantConnectorInstallsTable.tenantId, tenantId),
          ),
        )
        .limit(1);

      if (!install) {
        res.status(404).json({ error: "Installation not found" });
        return;
      }

      const [connector] = await db
        .select()
        .from(connectorsTable)
        .where(eq(connectorsTable.id, install.connectorId))
        .limit(1);

      const manifestJson = (connector?.capabilities as Record<string, unknown>)?.manifest as string | undefined;
      const manifest = manifestJson ? JSON.parse(manifestJson) : undefined;

      const result = await sandboxExecutionService.execute({
        connectorName: connector?.name ?? "unknown",
        connectorId: connector?.id ?? "",
        installationId,
        tenantId,
        actionId,
        auth: (install.config as Record<string, unknown>)?.auth as Record<string, unknown> ?? {},
        config: install.config as Record<string, unknown> ?? {},
        input,
        secrets: {},
        manifest,
      });

      await db
        .update(tenantConnectorInstallsTable)
        .set({ lastUsedAt: new Date() })
        .where(eq(tenantConnectorInstallsTable.id, installationId));

      if (!result.success) {
        res.status(400).json({ success: false, error: result.error, durationMs: result.durationMs });
        return;
      }

      res.json({ success: true, data: result.data, durationMs: result.durationMs, trustTier: result.trustTier });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message, durationMs: 0 });
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
      const [install] = await db
        .select()
        .from(tenantConnectorInstallsTable)
        .where(
          and(
            eq(tenantConnectorInstallsTable.id, installationId),
            eq(tenantConnectorInstallsTable.tenantId, tenantId),
          ),
        )
        .limit(1);

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
      const [install] = await db
        .select()
        .from(tenantConnectorInstallsTable)
        .where(
          and(
            eq(tenantConnectorInstallsTable.id, installationId),
            eq(tenantConnectorInstallsTable.tenantId, tenantId),
          ),
        )
        .limit(1);

      if (!install) {
        res.status(404).json({ error: "Installation not found" });
        return;
      }

      const [connector] = await db
        .select()
        .from(connectorsTable)
        .where(eq(connectorsTable.id, install.connectorId))
        .limit(1);

      const manifestJson = (connector?.capabilities as Record<string, unknown>)?.manifest as string | undefined;
      const manifest = manifestJson ? JSON.parse(manifestJson) : undefined;

      const result = await sandboxExecutionService.execute({
        connectorName: connector?.name ?? "unknown",
        connectorId: connector?.id ?? "",
        installationId,
        tenantId,
        actionId: `poll:${triggerId}`,
        auth: (install.config as Record<string, unknown>)?.auth as Record<string, unknown> ?? {},
        config: install.config as Record<string, unknown> ?? {},
        input: { lastPollId },
        secrets: {},
        manifest,
      });

      if (!result.success) {
        res.status(400).json({ events: [], error: result.error ?? "Poll failed" });
        return;
      }

      res.json({ events: Array.isArray(result.data?.events) ? result.data.events : [], triggerId });
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
      const [install] = await db
        .select()
        .from(tenantConnectorInstallsTable)
        .where(
          and(
            eq(tenantConnectorInstallsTable.id, installationId),
            eq(tenantConnectorInstallsTable.tenantId, tenantId),
          ),
        )
        .limit(1);

      if (!install) {
        res.status(404).json({ error: "Installation not found" });
        return;
      }

      const [previousVersion] = await db
        .select()
        .from(connectorVersionsTable)
        .where(
          and(
            eq(connectorVersionsTable.connectorId, install.connectorId),
            eq(connectorVersionsTable.isDeprecated, false),
          ),
        )
        .orderBy(desc(connectorVersionsTable.createdAt))
        .limit(1)
        .offset(1);

      if (!previousVersion) {
        res.status(400).json({ error: "No previous version available for rollback" });
        return;
      }

      await db
        .update(tenantConnectorInstallsTable)
        .set({
          connectorVersionId: previousVersion.id,
          status: "active",
        })
        .where(eq(tenantConnectorInstallsTable.id, installationId));

      res.json({
        message: "Rollback successful",
        previousVersionId: previousVersion.id,
        version: previousVersion.semver,
      });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  },
);

export default router;
