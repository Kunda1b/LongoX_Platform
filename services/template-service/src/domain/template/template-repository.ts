export interface TemplateRepository {
  findById(id: string): Promise<unknown>;
  findAll(filter?: Record<string, unknown>): Promise<unknown[]>;
  save(template: unknown): Promise<void>;
  delete(id: string): Promise<void>;
}
