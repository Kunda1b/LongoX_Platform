import { logger } from "@longox/shared-logger";

export interface VaultConfig {
  url: string;
  token?: string;
  roleId?: string;
  secretId?: string;
  namespace?: string;
  engine?: string;
}

export interface VaultSecret {
  data: Record<string, unknown>;
  metadata: {
    createdTime: string;
    version: number;
    destructionTime?: string;
  };
  leaseDuration?: number;
  leaseId?: string;
  renewable?: boolean;
}

export class VaultClient {
  private config: VaultConfig;
  private cachedToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: VaultConfig) {
    this.config = { engine: "secret", ...config };
  }

  private async getToken(): Promise<string> {
    if (this.config.token) return this.config.token;

    if (this.cachedToken && Date.now() < this.tokenExpiry) {
      return this.cachedToken;
    }

    if (this.config.roleId && this.config.secretId) {
      return this.loginWithAppRole();
    }

    throw new Error("No Vault authentication method configured");
  }

  private async loginWithAppRole(): Promise<string> {
    const res = await fetch(`${this.config.url}/v1/auth/approle/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role_id: this.config.roleId,
        secret_id: this.config.secretId,
      }),
    });

    if (!res.ok) {
      throw new Error(`Vault AppRole login failed: ${res.status}`);
    }

    const data = (await res.json()) as {
      auth: { client_token: string; lease_duration: number };
    };

    this.cachedToken = data.auth.client_token;
    this.tokenExpiry = Date.now() + data.auth.lease_duration * 1000 - 60000;

    return this.cachedToken;
  }

  async read(path: string): Promise<VaultSecret | null> {
    const token = await this.getToken();
    const fullPath = `${this.config.url}/v1/${this.config.engine}/data/${path}`;

    try {
      const res = await fetch(fullPath, {
        headers: {
          "X-Vault-Token": token,
          ...(this.config.namespace
            ? { "X-Vault-Namespace": this.config.namespace }
            : {}),
        },
      });

      if (res.status === 404) return null;
      if (!res.ok) {
        logger.warn({ path, status: res.status }, "[Vault] Read failed");
        return null;
      }

      const body = (await res.json()) as {
        data: {
          data: Record<string, unknown>;
          metadata: VaultSecret["metadata"];
        };
        lease_id?: string;
        lease_duration?: number;
        renewable?: boolean;
      };

      return {
        data: body.data.data,
        metadata: body.data.metadata,
        leaseId: body.lease_id,
        leaseDuration: body.lease_duration,
        renewable: body.renewable,
      };
    } catch (err) {
      logger.error({ err, path }, "[Vault] Read error");
      return null;
    }
  }

  async write(path: string, data: Record<string, unknown>): Promise<boolean> {
    const token = await this.getToken();
    const fullPath = `${this.config.url}/v1/${this.config.engine}/data/${path}`;

    try {
      const res = await fetch(fullPath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Vault-Token": token,
          ...(this.config.namespace
            ? { "X-Vault-Namespace": this.config.namespace }
            : {}),
        },
        body: JSON.stringify({ data }),
      });

      return res.ok;
    } catch (err) {
      logger.error({ err, path }, "[Vault] Write error");
      return false;
    }
  }

  async delete(path: string): Promise<boolean> {
    const token = await this.getToken();
    const fullPath = `${this.config.url}/v1/${this.config.engine}/data/${path}`;

    try {
      const res = await fetch(fullPath, {
        method: "DELETE",
        headers: {
          "X-Vault-Token": token,
          ...(this.config.namespace
            ? { "X-Vault-Namespace": this.config.namespace }
            : {}),
        },
      });

      return res.ok;
    } catch (err) {
      logger.error({ err, path }, "[Vault] Delete error");
      return false;
    }
  }

  async list(prefix: string = ""): Promise<string[] | null> {
    const token = await this.getToken();
    const fullPath = `${this.config.url}/v1/${this.config.engine}/metadata/${prefix}`;

    try {
      const res = await fetch(fullPath, {
        method: "LIST",
        headers: {
          "X-Vault-Token": token,
          ...(this.config.namespace
            ? { "X-Vault-Namespace": this.config.namespace }
            : {}),
        },
      });

      if (res.status === 404) return [];
      if (!res.ok) return null;

      const body = (await res.json()) as { data: { keys: string[] } };
      return body.data.keys;
    } catch (err) {
      logger.error({ err, prefix }, "[Vault] List error");
      return null;
    }
  }

  async health(): Promise<{
    initialized: boolean;
    sealed: boolean;
    version: string;
  } | null> {
    try {
      const res = await fetch(`${this.config.url}/v1/sys/health`);
      if (!res.ok) return null;
      const body = (await res.json()) as {
        initialized: boolean;
        sealed: boolean;
        version: string;
      };
      return body;
    } catch {
      return null;
    }
  }
}

let defaultClient: VaultClient | null = null;

export function getVaultClient(config?: VaultConfig): VaultClient {
  if (!defaultClient && config) {
    defaultClient = new VaultClient(config);
  }
  if (!defaultClient) {
    defaultClient = new VaultClient({
      url: process.env["VAULT_ADDR"] ?? "http://localhost:8200",
      token: process.env["VAULT_TOKEN"],
      roleId: process.env["VAULT_ROLE_ID"],
      secretId: process.env["VAULT_SECRET_ID"],
      namespace: process.env["VAULT_NAMESPACE"],
      engine: process.env["VAULT_ENGINE"] ?? "secret",
    });
  }
  return defaultClient;
}
