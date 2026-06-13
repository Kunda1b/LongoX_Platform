import { Router, type IRouter } from "express";
import {
  SetFeatureFlagCommand,
  UpdateTenantCommand,
  CreatePolicyCommand,
} from "../../application";
import { authorize } from "@longox/shared-rbac";
import { getRegionManager } from "@longox/shared-region";

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

router.get(
  "/platform/regions",
  authorize({ resource: "admin", action: "read" }),
  async (_req, res): Promise<void> => {
    const manager = getRegionManager();
    res.json(manager.getAllRegions());
  },
);

router.post(
  "/platform/regions/health",
  authorize({ resource: "admin", action: "read" }),
  async (req, res): Promise<void> => {
    const manager = getRegionManager();
    const { regionId } = req.body as { regionId?: string };

    if (regionId) {
      res.json(await manager.checkHealth(regionId));
    } else {
      res.json(await manager.checkAllRegions());
    }
  },
);

router.post(
  "/platform/tenants/:id/region",
  authorize({ resource: "tenants", action: "write" }),
  async (req, res): Promise<void> => {
    const { primaryRegion, allowedRegions, dataResidencyRequired } =
      req.body as {
        primaryRegion?: string;
        allowedRegions?: string[];
        dataResidencyRequired?: boolean;
      };

    const manager = getRegionManager();
    if (primaryRegion && !manager.getRegion(primaryRegion)) {
      res.status(400).json({ error: `Unknown region: ${primaryRegion}` });
      return;
    }

    const result = await updateTenant.execute({
      id: req.params.id,
      primaryRegion: primaryRegion ?? null,
      allowedRegions: allowedRegions ?? [],
      dataResidencyRequired: dataResidencyRequired ?? false,
    });
    res.status(result.success ? 200 : 400).json(result);
  },
);

export default router;
