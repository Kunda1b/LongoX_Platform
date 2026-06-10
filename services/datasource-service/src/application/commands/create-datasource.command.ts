import { DataSource } from "../../domain";
import type { DataSourceRepository } from "../../domain";
import type {
  DataSourceKind,
  DataSourceConfig,
} from "../../domain/datasource.entity";

export interface CreateDataSourceInput {
  tenantId: number;
  name: string;
  description?: string;
  kind: DataSourceKind;
  config: DataSourceConfig;
  createdBy: number;
}

export class CreateDataSourceCommand {
  constructor(private repository: DataSourceRepository) {}

  async execute(input: CreateDataSourceInput): Promise<DataSource> {
    return this.repository.create({
      tenantId: input.tenantId,
      name: input.name,
      description: input.description,
      kind: input.kind,
      config: input.config,
      status: "active",
      createdBy: input.createdBy,
    });
  }
}

export interface UpdateDataSourceInput {
  name?: string;
  description?: string;
  config?: DataSourceConfig;
  status?: "active" | "inactive" | "error" | "testing";
}

export class UpdateDataSourceCommand {
  constructor(private repository: DataSourceRepository) {}

  async execute(id: number, input: UpdateDataSourceInput): Promise<DataSource> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new Error(`DataSource with id ${id} not found`);

    return this.repository.update(id, input);
  }
}

export class DeleteDataSourceCommand {
  constructor(private repository: DataSourceRepository) {}

  async execute(id: number): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new Error(`DataSource with id ${id} not found`);
    await this.repository.delete(id);
  }
}

export class TestDataSourceConnectionCommand {
  constructor(
    private repository: DataSourceRepository,
    private adapterRegistry: Map<
      string,
      import("../../domain").DataSourceAdapter
    >,
  ) {}

  async execute(id: number): Promise<{ success: boolean; error?: string }> {
    const ds = await this.repository.findById(id);
    if (!ds) throw new Error(`DataSource with id ${id} not found`);

    const adapter = this.adapterRegistry.get(ds.kind);
    if (!adapter) {
      ds.markTested(false, `No adapter available for kind: ${ds.kind}`);
      await this.repository.update(id, { status: ds.status });
      return {
        success: false,
        error: `Unsupported data source kind: ${ds.kind}`,
      };
    }

    const result = await adapter.testConnection(ds.config);
    ds.markTested(result.success, result.error);
    await this.repository.update(id, { status: ds.status });

    return result;
  }
}
