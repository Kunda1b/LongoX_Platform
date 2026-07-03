import bcrypt from "bcryptjs";
import type { UserRepository } from "../../domain/user/user-repository";
import type { Credentials } from "../../domain/user/user.entity";
import {
  issueSession,
  type SessionTokens,
} from "../../infrastructure/auth/jwt";

export interface LoginUser {
  id: number;
  email: string;
  name: string;
  tenantId: number | null;
  role: string;
}

/**
 * ADR-007 / §26.8 compliant login result.
 *
 * The route layer returns the `session` bundle as the JSON body:
 *   { access_token, refresh_token, expires_in: 3600, token_type: "Bearer",
 *     tenant_context: { tenant_id, role } }
 *
 * `user` is kept alongside for backwards compatibility with existing
 * frontend code that reads the user profile from the login response; new
 * clients should call GET /api/v1/auth/me instead.
 */
export type LoginResult =
  | { ok: true; session: SessionTokens; user: LoginUser }
  | { ok: false; status: number; error: string };

export class LoginCommand {
  constructor(private readonly repository: UserRepository) {}

  async execute(credentials: Credentials): Promise<LoginResult> {
    const email = credentials.email?.trim();
    const password = credentials.password?.trim();
    if (!email || !password) {
      return {
        ok: false,
        status: 400,
        error: "Email and password are required",
      };
    }

    const user = await this.repository.findByEmail(email);
    if (!user) {
      return { ok: false, status: 401, error: "Invalid email or password" };
    }
    if (!user.isActive) {
      return { ok: false, status: 401, error: "Account is disabled" };
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return { ok: false, status: 401, error: "Invalid email or password" };
    }

    await this.repository.updateLastLogin(user.id);

    const authUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      tenantId: user.tenantId,
      role: user.role,
    };
    const session = issueSession(authUser);
    return { ok: true, session, user: authUser };
  }
}
