import type { Request, Response } from "express";

/**
 * GraphQL execution context — injected into every resolver.
 * Referenced by graphql/codegen.ts for typed resolver generation.
 */
export interface GraphQLContext {
  req: Request;
  res: Response;
  user?: {
    id: string;
    email: string;
    tenantId: string;
    role: string;
  };
  tenantId?: string;
  correlationId: string;
}
