/**
 * Dashboard pages route.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.dashboard.findUnique` and accesses the legacy `widgets`
 * column via `as any` cast (not in the canonical Prisma schema).
 */

import { Router, type IRouter } from "express";
import { prisma } from "@longox/db/prisma";
import { derivePages } from "./dashboard-page";
import { authorize } from "@longox/shared-rbac";

const router: IRouter = Router();

router.get(
  "/dashboards/:id/pages",
  authorize("dashboards:read"),
  async (req, res): Promise<void> => {
    const id = String(req.params.id);
    if (!id) {
      res.status(400).json({ error: "Invalid dashboard id" });
      return;
    }

    const dashboard = await prisma.dashboard.findUnique({ where: { id } });

    if (!dashboard) {
      res.status(404).json({ error: "Dashboard not found" });
      return;
    }

    const components = Array.isArray((dashboard as any).widgets)
      ? ((dashboard as any).widgets as unknown[])
      : [];
    res.json(derivePages(components));
  },
);

export default router;
