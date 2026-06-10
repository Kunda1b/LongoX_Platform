import { Router, type IRouter } from "express";
import { WIDGET_CATALOG } from "./widget-catalog";

const router: IRouter = Router();

router.get("/widgets/catalog", (_req, res): void => {
  res.json(WIDGET_CATALOG);
});

router.get("/widgets/catalog/:id", (req, res): void => {
  const widget = WIDGET_CATALOG.find((w) => w.id === req.params.id);
  if (!widget) { res.status(404).json({ error: "Widget not found" }); return; }
  res.json(widget);
});

export default router;
