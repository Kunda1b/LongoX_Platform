export interface PostgresTemplateRepository {
  query(sql: string, params?: unknown[]): Promise<unknown>;
}
