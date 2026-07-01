import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, dashboardsTable } from "@longox/db";
import { derivePages } from "./dashboard-page";
import { authorize } from "@longox/shared-rbac";

const router: IRouter = Router();

router.get("/dashboards/:id/pages", authorize("dashboards:read"), async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid dashboard id" });
    return;
  }

  const [dashboard] = await db
    .select()
    .from(dashboardsTable)
    .where(eq(dashboardsTable.id, id))
    .limit(1);

  if (!dashboard) {
    res.status(404).json({ error: "Dashboard not found" });
    return;
  }

  const components = Array.isArray(dashboard.widgets)
    ? (dashboard.widgets as unknown[])
    : [];
  res.json(derivePages(components));
});

export default router;
