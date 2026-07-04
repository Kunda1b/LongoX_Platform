import type {
  DataSource,
  DataSourceKind,
  DataSourceProps,
} from "./datasource.entity";

export interface DataSourceRepository {
  findById(id: string): Promise<DataSource | null>;
  findByTenantId(
    tenantId: string,
    kind?: DataSourceKind,
  ): Promise<DataSource[]>;
  create(
    props: Omit<DataSourceProps, "id" | "createdAt" | "updatedAt">,
  ): Promise<DataSource>;
  update(id: string, data: Partial<DataSourceProps>): Promise<DataSource>;
  delete(id: string): Promise<void>;
  countByTenantId(tenantId: string): Promise<string>;
}
