export interface TemplateQuery { execute(params?: Record<string, unknown>): Promise<unknown[]>; }
