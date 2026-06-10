import type {
  DataSource,
  DataSourceKind,
  DataSourceProps,
} from "./datasource.entity";

export interface DataSourceRepository {
  findById(id: number): Promise<DataSource | null>;
  findByTenantId(
    tenantId: number,
    kind?: DataSourceKind,
  ): Promise<DataSource[]>;
  create(
    props: Omit<DataSourceProps, "id" | "createdAt" | "updatedAt">,
  ): Promise<DataSource>;
  update(id: number, data: Partial<DataSourceProps>): Promise<DataSource>;
  delete(id: number): Promise<void>;
  countByTenantId(tenantId: number): Promise<number>;
}
