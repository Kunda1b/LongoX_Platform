import { Router, type Request, type Response } from "express";
import { authorize } from "@longox/shared-rbac";
import { ftsSearchService } from "../services/search.service";

const router = Router();

router.get(
  "/api/search",
  authorize({ resource: "templates", action: "read" }),
  async (req: Request, res: Response): Promise<void> => {
    const q = ((req.query.q as string) ?? "").trim();
    if (!q) {
      res.json({ results: [], total: 0, page: 1, pageSize: 20 });
      return;
    }

    const type = req.query.type as string | undefined;
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(req.query.pageSize as string, 10) || 20),
    );

    const resourceTypes = type ? type.split(",").map((t) => t.trim()) : undefined;
    const tenantId = req.user?.tenantId ?? null;

    const response = await ftsSearchService.search(q, {
      tenantId,
      resourceTypes,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    res.json(response);
  },
);

export default router;
