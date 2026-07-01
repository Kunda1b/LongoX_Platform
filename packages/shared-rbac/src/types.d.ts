/**
 * Augment Express.Request with RBAC and correlation fields.
 * These are also declared in auth.ts — this file ensures the types are
 * available in packages that depend on shared-rbac but not api-gateway.
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        name: string;
        tenantId: number | null;
        role: string;
      };
      tenantId?: number;
      correlationId?: string;
    }
  }
}

export {};
