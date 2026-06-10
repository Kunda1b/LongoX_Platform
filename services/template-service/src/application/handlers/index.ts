export interface TemplateHandler { handle(event: Record<string, unknown>): Promise<void>; }
