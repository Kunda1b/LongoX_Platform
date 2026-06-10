export interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlMs?: number): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  clear(): Promise<void>;
}

export class InMemoryCache implements CacheStore {
  private store = new Map<string, { value: unknown; expiresAt: number }>();
  private defaultTtlMs = 60_000;

  constructor(defaultTtlMs?: number) {
    if (defaultTtlMs !== undefined) this.defaultTtlMs = defaultTtlMs;
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}

export class RedisCache implements CacheStore {
  private client: import("ioredis").Redis | null = null;
  private defaultTtlMs = 60_000;
  private connectionPromise: Promise<void> | null = null;

  constructor(url?: string, defaultTtlMs?: number) {
    if (defaultTtlMs !== undefined) this.defaultTtlMs = defaultTtlMs;
    if (url) this.connect(url);
  }

  private async connect(url: string): Promise<void> {
    if (this.connectionPromise) return this.connectionPromise;
    this.connectionPromise = (async () => {
      try {
        const { Redis } = await import("ioredis");
        this.client = new Redis(url, {
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => Math.min(times * 100, 3000),
          lazyConnect: true,
        });
        await this.client.connect();
      } catch (err) {
        console.warn(
          "[RedisCache] Failed to connect, falling back to in-memory:",
          err,
        );
        this.client = null;
      }
    })();
    return this.connectionPromise;
  }

  private async ensureConnected(): Promise<void> {
    if (this.connectionPromise) await this.connectionPromise;
  }

  async get<T>(key: string): Promise<T | null> {
    await this.ensureConnected();
    if (!this.client) return null;
    try {
      const val = await this.client.get(key);
      return val ? (JSON.parse(val) as T) : null;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    await this.ensureConnected();
    if (!this.client) return;
    try {
      const ttlSeconds = Math.ceil((ttlMs ?? this.defaultTtlMs) / 1000);
      await this.client.setex(key, ttlSeconds, JSON.stringify(value));
    } catch {
      /* silent */
    }
  }

  async del(key: string): Promise<void> {
    await this.ensureConnected();
    if (!this.client) return;
    try {
      await this.client.del(key);
    } catch {
      /* silent */
    }
  }

  async exists(key: string): Promise<boolean> {
    await this.ensureConnected();
    if (!this.client) return false;
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch {
      return false;
    }
  }

  async clear(): Promise<void> {
    await this.ensureConnected();
    if (!this.client) return;
    try {
      await this.client.flushdb();
    } catch {
      /* silent */
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
      } catch {
        /* silent */
      }
      this.client = null;
    }
  }
}

export class NoOpCache implements CacheStore {
  async get<T>(): Promise<T | null> {
    return null;
  }
  async set(): Promise<void> {}
  async del(): Promise<void> {}
  async exists(): Promise<boolean> {
    return false;
  }
  async clear(): Promise<void> {}
}

let defaultCache: CacheStore = new NoOpCache();

export function setDefaultCache(cache: CacheStore): void {
  defaultCache = cache;
}

export function getDefaultCache(): CacheStore {
  return defaultCache;
}

export function initCache(redisUrl?: string): CacheStore {
  if (redisUrl) {
    const cache = new RedisCache(redisUrl);
    setDefaultCache(cache);
    return cache;
  }
  const cache = new InMemoryCache();
  setDefaultCache(cache);
  return cache;
}
