export interface PostgresPlatformRepository { query(sql: string, params?: unknown[]): Promise<unknown>; }
