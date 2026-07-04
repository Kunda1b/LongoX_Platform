/**
 * Express Request augmentation for api-gateway.
 *
 * NOTE: The `user` property is also declared in `packages/shared-auth/src/index.ts`
 * and `packages/shared-rbac/src/index.ts`. TypeScript merges global
 * `Express.Request` declarations and TS2717 fires if any of them disagree.
 * All three declarations MUST use the same shape:
 *   `{ id, email, name, tenantId: string | null, role }`
 *
 * This file only adds `correlationId` and `tenantId` request augmentations;
 * the `user` declaration is kept here for backward compatibility with
 * downstream code that imports this file directly, but it MUST stay in sync
 * with shared-auth and shared-rbac.
 */
declare namespace Express {
  interface Request {
    correlationId?: string;
    tenantId?: string;
    user?: {
      id: string;
      email: string;
      name: string;
      tenantId: string | null;
      role: string;
    };
  }
}
