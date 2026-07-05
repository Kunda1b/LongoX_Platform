import { Router, type IRouter } from "express";
import {
  runDashboardQuery,
  SUPPORTED_METRICS,
  type DashboardMetric,
} from "./dashboard-query";
import { authorize } from "@longox/shared-rbac";

const router: IRouter = Router();

function isSupported(metric: string): metric is DashboardMetric {
  return (SUPPORTED_METRICS as string[]).includes(metric);
}

router.get(
  "/dashboards/query/metrics",
  authorize("dashboards:read"),
  (_req, res): void => {
    res.json(SUPPORTED_METRICS);
  },
);

router.post(
  "/dashboards/query",
  authorize("dashboards:read"),
  async (req, res): Promise<void> => {
    const { metric } = req.body as { metric?: string };
    if (!metric || !isSupported(metric)) {
      res.status(400).json({
        error: "Unsupported metric",
        supported: SUPPORTED_METRICS,
      });
      return;
    }
    const result = await runDashboardQuery(metric);
    res.json(result);
  },
);

export default router;
