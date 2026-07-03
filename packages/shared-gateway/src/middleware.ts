import type { Request, Response, NextFunction } from "express";
// Side-effect import: pulls in the `declare global { namespace Express }`
// augmentation from shared-rbac so that `req.user` is typed on every
// Request in this package. Without this import, TypeScript doesn't see
// the global augmentation and `req.user` errors as TS2339.
import "@longox/shared-rbac";
import { ServiceMeshClient } from "./mesh-client";
import {
  createDefaultMeshConfig,
  type ServiceMeshConfig,
} from "./service-mesh";

export function createServiceMeshMiddleware(
  config?: ServiceMeshConfig,
): (req: Request, res: Response, next: NextFunction) => void {
  const meshConfig = config ?? createDefaultMeshConfig();
  const client = new ServiceMeshClient(meshConfig);

  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const serviceName = client.resolveService(req.path);

    if (!serviceName) {
      next();
      return;
    }

    const user = req.user
      ? {
          id: req.user.id,
          tenantId: req.user.tenantId,
          role: req.user.role,
        }
      : undefined;

    const response = await client.proxy({
      method: req.method,
      path: req.path,
      body: req.body,
      headers: req.headers as Record<string, string>,
      query: req.query as Record<string, string>,
      user,
    });

    res.status(response.status).json(response.body);
  };
}

export function createHealthCheckRoute(
  config?: ServiceMeshConfig,
): (req: Request, res: Response) => Promise<void> {
  const meshConfig = config ?? createDefaultMeshConfig();
  const client = new ServiceMeshClient(meshConfig);

  return async (_req: Request, res: Response): Promise<void> => {
    const health = await client.healthCheckAll();
    const allHealthy = Object.values(health).every((h) => h.healthy);

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? "ok" : "degraded",
      services: health,
    });
  };
}
