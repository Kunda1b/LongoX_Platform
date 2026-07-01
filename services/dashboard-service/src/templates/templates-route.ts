import { Router, type IRouter } from "express";
import { DASHBOARD_TEMPLATE_CATALOG } from "./dashboard-template-catalog";
import { authorize } from "@longox/shared-rbac";

const router: IRouter = Router();

router.get("/dashboard-templates", authorize("dashboards:read"), (_req, res): void => {
  res.json(DASHBOARD_TEMPLATE_CATALOG);
});

router.get("/dashboard-templates/:id", authorize("dashboards:read"), (req, res): void => {
  const template = DASHBOARD_TEMPLATE_CATALOG.find(
    (t) => t.id === req.params.id,
  );
  if (!template) {
    res.status(404).json({ error: "Template not found" });
    return;
  }
  res.json(template);
});

export default router;
