export interface PlatformQuery {
  execute(params?: Record<string, unknown>): Promise<unknown[]>;
}
