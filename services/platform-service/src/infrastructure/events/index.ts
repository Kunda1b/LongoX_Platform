export interface PlatformEventPublisher {
  publish(event: { type: string; payload: unknown }): Promise<void>;
}
