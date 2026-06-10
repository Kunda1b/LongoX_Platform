import { Router, type IRouter } from "express";
import { SearchQuery } from "../../application/queries/search.query";
import { PostgresSearchRepository } from "../../infrastructure/postgres/search-repository";
import type { SearchableType } from "../../domain/search/search-result.entity";

const router: IRouter = Router();
const searchQuery = new SearchQuery(new PostgresSearchRepository());

const ALL_TYPES: SearchableType[] = [
  "workflows",
  "apps",
  "templates",
  "connectors",
];

router.get("/search", async (req, res): Promise<void> => {
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

export default router;
