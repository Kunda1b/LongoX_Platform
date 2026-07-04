import { Router, type IRouter, type Request, type Response } from "express";
import { authorize } from "@longox/shared-rbac";
import { BackupRestoreService } from "../application/services/backup-restore.service";
import { ReleaseRollbackService } from "../application/services/release-rollback.service";
import { db, regionalPoolsTable, backupRecordsTable, restoreRecordsTable } from "@longox/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();
const backupRestore = new BackupRestoreService();
const releaseRollback = new ReleaseRollbackService();

router.post(
  "/dr/backup",
  authorize({ resource: "tenants", action: "admin" }),
  async (req: Request, res: Response): Promise<void> => {
    const { tenantId, scope } = req.body as { tenantId?: string; scope?: string };
    if (!tenantId) {
      res.status(400).json({ error: "tenantId is required" });
      return;
    }
    try {
      const result = await backupRestore.createBackup(
        tenantId,
        (scope as any) ?? "full",
      );
      res.status(201).json(result);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  },
);

router.get(
  "/dr/backups",
  authorize({ resource: "tenants", action: "admin" }),
  async (req: Request, res: Response): Promise<void> => {
    const { tenantId, dateFrom, dateTo, scope, status } =
      req.query as Record<string, string | undefined>;
    if (!tenantId) {
      res.status(400).json({ error: "tenantId is required" });
      return;
    }
    try {
      const result = await backupRestore.listBackups(Number(tenantId), {
        dateFrom,
        dateTo,
        scope: scope as any,
        status: status as any,
      });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  },
);

router.get(
  "/dr/backups/:id",
  authorize({ resource: "tenants", action: "admin" }),
  async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    if (!id) {
      res.status(400).json({ error: "Invalid backup id" });
      return;
    }
    try {
      const result = await backupRestore.getBackup(id);
      if (!result) {
        res.status(404).json({ error: "Backup not found" });
        return;
      }
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  },
);

router.post(
  "/dr/backups/:id/validate",
  authorize({ resource: "tenants", action: "admin" }),
  async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    if (!id) {
      res.status(400).json({ error: "Invalid backup id" });
      return;
    }
    try {
      const result = await backupRestore.validateBackup(id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  },
);

router.post(
  "/dr/backups/:id/restore",
  authorize({ resource: "tenants", action: "admin" }),
  async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    if (!id) {
      res.status(400).json({ error: "Invalid backup id" });
      return;
    }
    const { tenantId, restoreType, targetEnvironment, tables, restoredBy, notes } =
      req.body as Record<string, unknown>;
    if (!tenantId) {
      res.status(400).json({ error: "tenantId is required" });
      return;
    }
    try {
      const result = await backupRestore.restoreBackup(id, Number(tenantId), {
        restoreType: restoreType as any,
        targetEnvironment: targetEnvironment as string | undefined,
        tables: tables as string[] | undefined,
        restoredBy: restoredBy as string | undefined,
        notes: notes as string | undefined,
      });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  },
);

router.get(
  "/dr/restores/:id",
  authorize({ resource: "tenants", action: "admin" }),
  async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    if (!id) {
      res.status(400).json({ error: "Invalid restore id" });
      return;
    }
    try {
      const [record] = await db
        .select()
        .from(restoreRecordsTable)
        .where(eq(restoreRecordsTable.id, id))
        .limit(1);
      if (!record) {
        res.status(404).json({ error: "Restore record not found" });
        return;
      }
      res.json(record);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  },
);

router.post(
  "/dr/rollback/plan",
  authorize({ resource: "tenants", action: "admin" }),
  async (req: Request, res: Response): Promise<void> => {
    const { service, targetVersion } = req.body as { service?: string; targetVersion?: string };
    if (!service || !targetVersion) {
      res.status(400).json({ error: "service and targetVersion are required" });
      return;
    }
    try {
      const plan = await releaseRollback.planRollback(service, targetVersion);
      res.json(plan);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  },
);

router.post(
  "/dr/rollback/execute",
  authorize({ resource: "tenants", action: "admin" }),
  async (req: Request, res: Response): Promise<void> => {
    const { service, targetVersion } = req.body as { service?: string; targetVersion?: string };
    if (!service || !targetVersion) {
      res.status(400).json({ error: "service and targetVersion are required" });
      return;
    }
    try {
      const result = await releaseRollback.executeRollback(service, targetVersion);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  },
);

router.get(
  "/dr/rollbacks",
  authorize({ resource: "tenants", action: "admin" }),
  async (req: Request, res: Response): Promise<void> => {
    const { service } = req.query as { service?: string };
    if (!service) {
      res.status(400).json({ error: "service query parameter is required" });
      return;
    }
    try {
      const history = await releaseRollback.getRollbackHistory(service);
      res.json(history);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  },
);

router.get(
  "/dr/pools",
  authorize({ resource: "tenants", action: "admin" }),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const pools = await db.select().from(regionalPoolsTable);
      res.json(pools);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  },
);

router.get(
  "/dr/pools/:region",
  authorize({ resource: "tenants", action: "admin" }),
  async (req: Request, res: Response): Promise<void> => {
    const { region } = req.params;
    try {
      const { RegionalExecutionPoolService } = require("@longox/execution-service");
      const poolService = new RegionalExecutionPoolService();
      const readiness = await poolService.getPoolReadiness(region);
      res.json(readiness);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  },
);

router.post(
  "/dr/pools/:region/register",
  authorize({ resource: "tenants", action: "admin" }),
  async (req: Request, res: Response): Promise<void> => {
    const { region } = req.params;
    const metrics = req.body;
    try {
      const { RegionalExecutionPoolService } = require("@longox/execution-service");
      const poolService = new RegionalExecutionPoolService();
      const result = await poolService.registerPoolHeartbeat(region, metrics);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  },
);

router.post(
  "/dr/drills/failover",
  authorize({ resource: "tenants", action: "admin" }),
  async (req: Request, res: Response): Promise<void> => {
    const { targetRegionId } = req.body as { targetRegionId?: string };
    try {
      const { RegionalExecutionPoolService } = require("@longox/execution-service");
      const poolService = new RegionalExecutionPoolService();
      const result = await poolService.handleRegionDegradation(
        targetRegionId ?? "primary",
      );
      res.json({ drillExecuted: true, ...result });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  },
);

router.post(
  "/dr/drills/backup",
  authorize({ resource: "tenants", action: "admin" }),
  async (req: Request, res: Response): Promise<void> => {
    const { tenantId } = req.body as { tenantId?: string };
    if (!tenantId) {
      res.status(400).json({ error: "tenantId is required" });
      return;
    }
    try {
      const backup = await backupRestore.createBackup(tenantId, "full");
      const restored = await backupRestore.restoreBackup(backup.id, tenantId, {
        restoreType: "dry_run",
        notes: "DR drill — backup restore rehearsal",
      });
      res.json({
        drillExecuted: true,
        backup: backup,
        restore: restored,
        message: "Backup/restore drill completed successfully",
      });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  },
);

export default router;
