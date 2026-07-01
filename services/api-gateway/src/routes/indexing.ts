import { Router, type Request, type Response } from "express";
import { authorize } from "@longox/shared-rbac";
import { ftsSearchService } from "../services/search.service";

const router = Router();

router.post(
  "/api/search/reindex",
  authorize({ resource: "templates", action: "admin" }),
  async (_req: Request, res: Response): Promise<void> => {
    const result = await ftsSearchService.bulkReindex();
    res.json(result);
  },
);

router.post(
  "/api/search/reindex/:resourceType",
  authorize({ resource: "templates", action: "admin" }),
  async (req: Request, res: Response): Promise<void> => {
    const resourceType = req.params.resourceType as string;
    const result = await ftsSearchService.bulkReindex(resourceType);
    res.json(result);
  },
);

export default router;
