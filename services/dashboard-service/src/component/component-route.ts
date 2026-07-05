import { Router, type IRouter } from "express";
import { COMPONENT_CATALOG } from "./component-catalog";
import { authorize } from "@longox/shared-rbac";

const router: IRouter = Router();

// Architecture term "component"; the platform's concrete component type is the
// dashboard "widget". Both paths are served for backwards compatibility.
for (const base of ["/components", "/widgets"]) {
  router.get(
    `${base}/catalog`,
    authorize("dashboards:read"),
    (_req, res): void => {
      res.json(COMPONENT_CATALOG);
    },
  );

  router.get(
    `${base}/catalog/:id`,
    authorize("dashboards:read"),
    (req, res): void => {
      const component = COMPONENT_CATALOG.find((c) => c.id === req.params.id);
      if (!component) {
        res.status(404).json({ error: "Component not found" });
        return;
      }
      res.json(component);
    },
  );
}

export default router;
