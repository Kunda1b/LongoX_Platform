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
