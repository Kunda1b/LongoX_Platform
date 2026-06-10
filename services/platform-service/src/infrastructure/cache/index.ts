export interface PlatformCache { get(key: string): Promise<unknown>; set(key: string, value: unknown, ttl?: number): Promise<void>; delete(key: string): Promise<void>; }
