export interface TemplateEventPublisher { publish(event: { type: string; payload: unknown }): Promise<void>; }
