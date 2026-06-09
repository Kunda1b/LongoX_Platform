import { Router, type IRouter } from "express";
import healthRouter from "./health";
import workflowsRouter from "./workflows";
import executionsRouter from "./executions";
import connectorsRouter from "./connectors";
import appsRouter from "./apps";
import dashboardRouter from "./dashboard";
import templatesRouter from "./templates";
import credentialsRouter from "./credentials";
import analyticsRouter from "./analytics";
import nodeTypesRouter from "./node-types";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(analyticsRouter);
router.use(nodeTypesRouter);
router.use(templatesRouter);
router.use(credentialsRouter);
router.use(workflowsRouter);
router.use(executionsRouter);
router.use(connectorsRouter);
router.use(appsRouter);

export default router;
