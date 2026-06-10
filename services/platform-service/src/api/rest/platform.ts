import { Router, type IRouter } from "express";
import {
  SetFeatureFlagCommand,
  UpdateTenantCommand,
  CreatePolicyCommand,
} from "../../application";

const router: IRouter = Router();

const setFeatureFlag = new SetFeatureFlagCommand();
const updateTenant = new UpdateTenantCommand();
const createPolicy = new CreatePolicyCommand();

router.post("/platform/feature-flags", async (req, res): Promise<void> => {
  const result = await setFeatureFlag.execute(
    req.body as Record<string, unknown>,
  );
  res.status(result.success ? 200 : 400).json(result);
});

router.patch("/platform/tenants/:id", async (req, res): Promise<void> => {
  const result = await updateTenant.execute({
    id: req.params.id,
    ...(req.body as Record<string, unknown>),
  });
  res.status(result.success ? 200 : 400).json(result);
});

router.post("/platform/policies", async (req, res): Promise<void> => {
  const result = await createPolicy.execute(
    req.body as Record<string, unknown>,
  );
  res.status(result.success ? 201 : 400).json(result);
});

export default router;
