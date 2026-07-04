import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

const CORRELATION_HEADER = "x-correlation-id";

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
      tenantId?: string;
    }
  }
}

export function correlationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const incoming = req.headers[CORRELATION_HEADER];
  const correlationId =
    typeof incoming === "string" && incoming.trim()
      ? incoming.trim()
      : randomUUID();

  req.correlationId = correlationId;
  res.setHeader(CORRELATION_HEADER, correlationId);
  next();
}
