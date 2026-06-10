import type { Request, Response, NextFunction } from "express";
import type { AuthUser } from "../../domain/user/user.entity";
import type { UserRepository } from "../../domain/user/user-repository";
import { verifyToken } from "./jwt";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function createAuthMiddleware(repository: UserRepository) {
  return async function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const header = req.headers["authorization"];
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const user = verifyToken(token);
    if (!user) {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    const active = await repository.isActive(user.id);
    if (!active) {
      res.status(401).json({ error: "Account disabled or not found" });
      return;
    }

    req.user = user;
    next();
  };
}
