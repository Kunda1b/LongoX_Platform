declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        tenantId: string | null;
        role: string;
      };
      tenantId?: string;
      correlationId?: string;
    }
  }
}

export {};
