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

export class NoOpCache implements CacheStore {
  async get<T>(): Promise<T | null> { return null; }
  async set(): Promise<void> { }
  async del(): Promise<void> { }
  async exists(): Promise<boolean> { return false; }
  async clear(): Promise<void> { }
}

let defaultCache: CacheStore = new NoOpCache();

export function setDefaultCache(cache: CacheStore): void {
  defaultCache = cache;
}

export function getDefaultCache(): CacheStore {
  return defaultCache;
}
