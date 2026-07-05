import { Router, type IRouter } from "express";
import { resolveDashboardPermissions } from "./dashboard-permissions";
import { authorize } from "@longox/shared-rbac";

const router: IRouter = Router();

router.get(
  "/dashboards/permissions",
  authorize("dashboards:read"),
  (req, res): void => {
    const headerRole = req.headers["x-user-role"];
    const role = (
      (typeof headerRole === "string" ? headerRole : undefined) ??
      (req.query.role as string | undefined) ??
      "viewer"
    ).toLowerCase();
    res.json({ role, permissions: resolveDashboardPermissions(role) });
  },
);

export default router;
