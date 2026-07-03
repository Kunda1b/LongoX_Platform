import { Router, type IRouter } from "express";
import { authorize } from "@longox/shared-rbac";
import {
  RetentionPolicyService,
  PartitionManagerService,
  ArchiveExportService,
  RetentionSchedulerService,
} from "../application/services";

const router: IRouter = Router();
const policyService = new RetentionPolicyService();
const partitionManager = new PartitionManagerService();
const archiveService = new ArchiveExportService();
const scheduler = new RetentionSchedulerService();

router.get(
  "/api/retention/policy",
  authorize({ resource: "executions", action: "read" }),
  async (req, res): Promise<void> => {
    const tenantId = parseInt(req.headers["x-tenant-id"] as string, 10);
    if (!tenantId) {
      res.status(400).json({ error: "x-tenant-id header required" });
      return;
    }

    const policy = await policyService.getPolicy(tenantId);
    res.json(policy);
  },
);

router.put(
  "/api/retention/policy",
  authorize({ resource: "executions", action: "write" }),
  async (req, res): Promise<void> => {
    const tenantId = parseInt(req.headers["x-tenant-id"] as string, 10);
    if (!tenantId) {
      res.status(400).json({ error: "x-tenant-id header required" });
      return;
    }

    const policy = await policyService.setPolicy(tenantId, req.body);
    res.json(policy);
  },
);

router.post(
  "/api/retention/partitions/create",
  authorize({ resource: "executions", action: "write" }),
  async (req, res): Promise<void> => {
    const tenantId = parseInt(req.headers["x-tenant-id"] as string, 10);
    if (!tenantId) {
      res.status(400).json({ error: "x-tenant-id header required" });
      return;
    }

    const { tableName, startDate, endDate, interval } = req.body;
    if (!tableName || !startDate || !endDate) {
      res.status(400).json({ error: "tableName, startDate, endDate required" });
      return;
    }

    const partitions = await partitionManager.createPartitions(
      tableName,
      new Date(startDate),
      new Date(endDate),
      interval ?? "month",
    );

    res.status(201).json({ partitions });
  },
);

router.get(
  "/api/retention/partitions",
  authorize({ resource: "executions", action: "read" }),
  async (req, res): Promise<void> => {
    const tenantId = parseInt(req.headers["x-tenant-id"] as string, 10);
    if (!tenantId) {
      res.status(400).json({ error: "x-tenant-id header required" });
      return;
    }

    const { filter } = req.query;
    let partitions;

    if (filter === "active") {
      partitions = await partitionManager.getActivePartitions(tenantId);
    } else if (filter === "expired") {
      partitions = await partitionManager.getExpiredPartitions(tenantId);
    } else {
      partitions = await partitionManager.getPartitions();
    }

    res.json({ partitions });
  },
);

router.post(
  "/api/retention/archive",
  authorize({ resource: "executions", action: "write" }),
  async (req, res): Promise<void> => {
    const tenantId = parseInt(req.headers["x-tenant-id"] as string, 10);
    if (!tenantId) {
      res.status(400).json({ error: "x-tenant-id header required" });
      return;
    }

    const { tableName, startDate, endDate } = req.body;
    if (!tableName || !startDate || !endDate) {
      res.status(400).json({ error: "tableName, startDate, endDate required" });
      return;
    }

    const exportRecord = await archiveService.exportToParquet(
      tableName,
      new Date(startDate),
      new Date(endDate),
      tenantId,
    );

    res.status(202).json(exportRecord);
  },
);

router.get(
  "/api/retention/archives",
  authorize({ resource: "executions", action: "read" }),
  async (req, res): Promise<void> => {
    const tenantId = parseInt(req.headers["x-tenant-id"] as string, 10);
    if (!tenantId) {
      res.status(400).json({ error: "x-tenant-id header required" });
      return;
    }

    const exports = await archiveService.listExports(tenantId);
    res.json({ exports });
  },
);

router.get(
  "/api/retention/archives/:id",
  authorize({ resource: "executions", action: "read" }),
  async (req, res): Promise<void> => {
    const exportId = parseInt(String(req.params.id), 10);
    if (!exportId) {
      res.status(400).json({ error: "Invalid export id" });
      return;
    }

    const record = await archiveService.getExportStatus(exportId);
    if (!record) {
      res.status(404).json({ error: "Export not found" });
      return;
    }

    res.json(record);
  },
);

router.post(
  "/api/retention/scheduler/run",
  authorize({ resource: "executions", action: "write" }),
  async (req, res): Promise<void> => {
    const { tenantId, action } = req.body;

    if (tenantId && action) {
      await scheduler.runManual(parseInt(tenantId, 10), action);
      res.json({ message: `Manual ${action} completed for tenant ${tenantId}` });
      return;
    }

    await scheduler.runDaily();
    res.json({ message: "Daily retention run completed" });
  },
);

export default router;
