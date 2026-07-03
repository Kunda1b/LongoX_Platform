declare namespace Express {
  interface Request {
    correlationId?: string;
    tenantId?: number;
    user?: {
      id: number;
      tenantId: number;
      role: string;
      email: string;
    };
  }
}
