import bcrypt from "bcryptjs";
import type { UserRepository } from "../../domain/user/user-repository";
import type { Credentials } from "../../domain/user/user.entity";
import { signToken } from "../../infrastructure/auth/jwt";

export interface LoginUser {
  id: number;
  email: string;
  name: string;
  tenantId: number | null;
  role: string;
}

export type LoginResult =
  | { ok: true; token: string; user: LoginUser }
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
    const token = signToken(authUser);
    return { ok: true, token, user: authUser };
  }
}
