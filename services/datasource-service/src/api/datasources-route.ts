import { Router, type IRouter } from "express";
import { prisma } from "@longox/db/prisma";
import { PostgresDataSourceRepository } from "../infrastructure";
import { AdapterRegistry } from "../infrastructure";
import {
  CreateDataSourceCommand,
  UpdateDataSourceCommand,
  DeleteDataSourceCommand,
  TestDataSourceConnectionCommand,
} from "../application";

const router: IRouter = Router();
const dsRepo = new PostgresDataSourceRepository();
const adapterRegistry = new AdapterRegistry();
const createDs = new CreateDataSourceCommand(dsRepo);
const updateDs = new UpdateDataSourceCommand(dsRepo);
const deleteDs = new DeleteDataSourceCommand(dsRepo);
const testDs = new TestDataSourceConnectionCommand(
  dsRepo,
  adapterRegistry as any,
);

function serializeDs(row: any) {
  return {
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    description: row.description ?? null,
    kind: row.kind,
    config: (row.configJson ?? row.config) ?? {},
    status: row.status ?? (row.isActive ? "active" : "inactive"),
    lastTestedAt: row.lastTestedAt instanceof Date ? row.lastTestedAt.toISOString() : (row.lastTestedAt ?? null),
    lastTestError: row.lastTestError ?? null,
    createdBy: row.createdBy ?? null,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt,
  };
}

router.get("/datasources", async (req, res): Promise<void> => {
  const tenantId = String(req.query.tenantId) || undefined;
  const kind = req.query.kind as string | undefined;
  const limit = Math.min(Number(req.query.limit) || 50, 200);

  const where: Record<string, unknown> = {};
  if (tenantId) where.tenantId = tenantId;
  if (kind) where.kind = kind;

  const rows = await prisma.dataSource.findMany({
    where: where as any,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  res.json(rows.map(serializeDs));
});

router.get("/datasources/adapters", async (_req, res): Promise<void> => {
  const kinds = adapterRegistry.getAvailableKinds();
  res.json(kinds);
});

router.get("/datasources/:id", async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }

  const row = await prisma.dataSource.findUnique({ where: { id } });
  if (!row) {
    res.status(404).json({ error: "Data source not found" });
    return;
  }

  res.json(serializeDs(row));
});

router.post("/datasources", async (req, res): Promise<void> => {
  const { tenantId, name, description, kind, config, createdBy } =
    req.body as Record<string, unknown>;

  if (!tenantId || !name || !kind || !createdBy) {
    res
      .status(400)
      .json({ error: "tenantId, name, kind, and createdBy are required" });
    return;
  }

  try {
    const ds = await createDs.execute({
      tenantId: String(tenantId),
      name: String(name),
      description: description ? String(description) : undefined,
      kind: String(kind) as any,
      config: (config ?? {}) as Record<string, unknown>,
      createdBy: String(createdBy),
    });
    res.status(201).json(ds.toJSON());
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.patch("/datasources/:id", async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }

  try {
    const ds = await updateDs.execute(id, req.body);
    res.json(ds.toJSON());
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});

router.delete("/datasources/:id", async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }

  try {
    await deleteDs.execute(id);
    res.sendStatus(204);
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});

router.post("/datasources/:id/test", async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }

  try {
    const result = await testDs.execute(id);
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});

router.post("/datasources/:id/query", async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }

  const { query } = req.body as { query?: string };
  if (!query) {
    res.status(400).json({ error: "query is required" });
    return;
  }

  const ds = await dsRepo.findById(id);
  if (!ds) {
    res.status(404).json({ error: "Data source not found" });
    return;
  }

  const adapter = adapterRegistry.get(ds.kind);
  if (!adapter) {
    res.status(400).json({ error: `Unsupported data source kind: ${ds.kind}` });
    return;
  }

  try {
    const result = await adapter.executeQuery(ds.config, query);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.get("/datasources/:id/tables", async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }

  const ds = await dsRepo.findById(id);
  if (!ds) {
    res.status(404).json({ error: "Data source not found" });
    return;
  }

  const adapter = adapterRegistry.get(ds.kind);
  if (!adapter) {
    res.status(400).json({ error: `Unsupported data source kind: ${ds.kind}` });
    return;
  }

  try {
    const tables = await adapter.listTables(ds.config);
    res.json(tables);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export default router;
