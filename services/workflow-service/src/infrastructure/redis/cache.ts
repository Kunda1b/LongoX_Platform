import type { CacheStore } from "@autoflow/shared-cache";

export class RedisWorkflowCache implements CacheStore {
  private prefix = "workflow:";

  constructor(private readonly ttlMs: number = 300_000) {}

  private key(id: string): string {
    return `${this.prefix}${id}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = sessionStorage.getItem(this.key(key));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() > parsed.expiresAt) {
        sessionStorage.removeItem(this.key(key));
        return null;
      }
      return parsed.value as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    try {
      const expiresAt = Date.now() + (ttlMs ?? this.ttlMs);
      sessionStorage.setItem(this.key(key), JSON.stringify({ value, expiresAt }));
    } catch {
      // Non-fatal
    }
  }

  async del(key: string): Promise<void> {
    try {
      sessionStorage.removeItem(this.key(key));
    } catch {
      // Non-fatal
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const raw = sessionStorage.getItem(this.key(key));
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      if (Date.now() > parsed.expiresAt) {
        sessionStorage.removeItem(this.key(key));
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = Object.keys(sessionStorage).filter((k) => k.startsWith(this.prefix));
      for (const key of keys) sessionStorage.removeItem(key);
    } catch {
      // Non-fatal
    }
  }
}
