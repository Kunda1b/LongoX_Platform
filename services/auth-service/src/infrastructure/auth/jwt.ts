import jwt from "jsonwebtoken";
import type { AuthUser } from "../../domain/user/user.entity";

const JWT_SECRET =
  process.env["JWT_SECRET"] ?? "longox-dev-secret-change-in-production";
const JWT_EXPIRY = "24h";

export function signToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}
