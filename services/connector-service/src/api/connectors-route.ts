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
} from "../application";

const router: IRouter = Router();
const connectorRepo = new PostgresConnectorRepository();
const installCommand = new InstallConnectorCommand(connectorRepo);
const configureCommand = new ConfigureConnectorCommand(connectorRepo);
const upgradeCommand = new UpgradeConnectorCommand(connectorRepo);
const removeCommand = new RemoveConnectorCommand();

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
    const id = Number(req.params.id);
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
    const id = Number(req.params.id);
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
    const connectorId = Number(req.params.id);
    const tenantId = req.user!.tenantId!;
    const userId = req.user!.id;
    const config = (req.body.config ?? {}) as Record<string, unknown>;

    try {
      const installation = await installCommand.execute({
        tenantId,
        connectorId,
        config,
        installedBy: userId,
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
    const installationId = Number(req.params.installationId);
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
    const installationId = Number(req.params.installationId);
    const tenantId = req.user!.tenantId!;
    const newVersionId = Number(req.body.connectorVersionId);

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
    const connectorId = Number(req.params.id);
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
    const installationId = Number(req.params.installationId);
    const tenantId = req.user!.tenantId!;

    try {
      await removeCommand.execute({ tenantId, installationId });
      res.status(204).end();
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  },
);

export default router;
