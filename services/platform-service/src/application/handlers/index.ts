export interface PlatformHandler {
  handle(event: Record<string, unknown>): Promise<void>;
}
