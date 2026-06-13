import { Router, type IRouter } from "express";
import { authorize, requireTenantContext } from "@longox/shared-rbac";
import { SearchQuery } from "../../application/queries/search.query";
import { PostgresSearchRepository } from "../../infrastructure/postgres/search-repository";
import { TypesenseSearchRepository } from "../../infrastructure/typesense/search-repository";
import type { SearchableType } from "../../domain/search/search-result.entity";
import type { Request } from "express";

const router: IRouter = Router();

const useTypesense = process.env.TYPESENSE_API_KEY && process.env.TYPESENSE_HOST;
const repository = useTypesense
  ? new TypesenseSearchRepository()
  : new PostgresSearchRepository();
const searchQuery = new SearchQuery(repository);

const ALL_TYPES: SearchableType[] = [
  "workflows",
  "apps",
  "templates",
  "connectors",
];

function tenantIdFrom(req: Request): number {
  return req.user!.tenantId!;
}

router.get("/search", authorize("workflows.read"), requireTenantContext, async (req, res): Promise<void> => {
  const q = ((req.query.q as string) ?? "").trim();
  const typesParam =
    (req.query.types as string) ?? "workflows,apps,templates,connectors";
  const types = typesParam
    .split(",")
    .map((t) => t.trim())
    .filter((t): t is SearchableType =>
      ALL_TYPES.includes(t as SearchableType),
    );

  const response = await searchQuery.execute({ query: q, types });
  res.json(response);
});

router.get("/search/executions", authorize("executions.read"), requireTenantContext, async (req, res): Promise<void> => {
  const q = ((req.query.q as string) ?? "").trim();
  const status = req.query.status as string | undefined;
  const workflowId = req.query.workflowId
    ? parseInt(req.query.workflowId as string, 10)
    : undefined;
  const startDate = req.query.startDate
    ? new Date(req.query.startDate as string)
    : undefined;
  const endDate = req.query.endDate
    ? new Date(req.query.endDate as string)
    : undefined;
  const limit = req.query.limit
    ? parseInt(req.query.limit as string, 10)
    : undefined;

  const response = await searchQuery.searchExecutions({
    query: q,
    tenantId: tenantIdFrom(req),
    status,
    workflowId,
    startDate,
    endDate,
    limit,
  });

  res.json(response);
});

router.get("/search/audit-logs", authorize("audit.read"), requireTenantContext, async (req, res): Promise<void> => {
  const q = ((req.query.q as string) ?? "").trim();
  const action = req.query.action as string | undefined;
  const resource = req.query.resource as string | undefined;
  const userId = req.query.userId
    ? parseInt(req.query.userId as string, 10)
    : undefined;
  const startDate = req.query.startDate
    ? new Date(req.query.startDate as string)
    : undefined;
  const endDate = req.query.endDate
    ? new Date(req.query.endDate as string)
    : undefined;
  const limit = req.query.limit
    ? parseInt(req.query.limit as string, 10)
    : undefined;

  const response = await searchQuery.searchAuditLogs({
    query: q,
    tenantId: tenantIdFrom(req),
    action,
    resource,
    userId,
    startDate,
    endDate,
    limit,
  });

  res.json(response);
});

router.get("/search/prompts", authorize("ai.read"), requireTenantContext, async (req, res): Promise<void> => {
  const q = ((req.query.q as string) ?? "").trim();
  const model = req.query.model as string | undefined;
  const limit = req.query.limit
    ? parseInt(req.query.limit as string, 10)
    : undefined;

  const response = await searchQuery.searchAiPrompts({
    query: q,
    tenantId: tenantIdFrom(req),
    model,
    limit,
  });

  res.json(response);
});

export default router;
