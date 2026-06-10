import type { SdkConfig } from "../index.ts";

export interface AuthConfig extends SdkConfig {}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: {
    id: string;
    email: string;
    name: string;
    tenantId: string;
    roles: string[];
  };
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthClient {
  private config: AuthConfig;

  constructor(config: AuthConfig) {
    this.config = config;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (this.config.token) h["Authorization"] = `Bearer ${this.config.token}`;
    if (this.config.apiKey) h["X-Api-Key"] = this.config.apiKey;
    return h;
  }

  async login(email: string, password: string): Promise<AuthSession> {
    const res = await fetch(`${this.config.baseUrl}/api/auth/login`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message ?? `Login failed: ${res.status}`);
    }

    const data = (await res.json()) as {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
      user: AuthSession["user"];
    };

    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: Date.now() + data.expiresIn * 1000,
      user: data.user,
    };
  }

  async refresh(refreshToken: string): Promise<TokenResponse> {
    const res = await fetch(`${this.config.baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) throw new Error("Token refresh failed");
    return res.json() as Promise<TokenResponse>;
  }

  async logout(): Promise<void> {
    await fetch(`${this.config.baseUrl}/api/auth/logout`, {
      method: "POST",
      headers: this.headers(),
    });
  }

  async getSession(): Promise<AuthSession | null> {
    if (!this.config.token) return null;

    const res = await fetch(`${this.config.baseUrl}/api/auth/session`, {
      headers: this.headers(),
    });

    if (!res.ok) return null;
    return res.json() as Promise<AuthSession>;
  }

  async setupMfa(): Promise<{ secret: string; qrCode: string }> {
    const res = await fetch(`${this.config.baseUrl}/api/mfa/setup`, {
      method: "POST",
      headers: this.headers(),
    });

    if (!res.ok) throw new Error("MFA setup failed");
    return res.json() as Promise<{ secret: string; qrCode: string }>;
  }

  async verifyMfa(code: string): Promise<boolean> {
    const res = await fetch(`${this.config.baseUrl}/api/mfa/verify`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ code }),
    });

    return res.ok;
  }
}
