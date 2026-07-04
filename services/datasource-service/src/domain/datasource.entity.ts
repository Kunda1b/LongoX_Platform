export type DataSourceKind =
  | "postgresql"
  | "mysql"
  | "mongodb"
  | "rest_api"
  | "graphql"
  | "bigquery"
  | "snowflake"
  | "csv_upload"
  | "custom";
export type DataSourceStatus = "active" | "inactive" | "error" | "testing";

export interface DataSourceConfig {
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  ssl?: boolean;
  url?: string;
  headers?: Record<string, string>;
  queryTimeoutMs?: number;
  maxConnections?: number;
  [key: string]: unknown;
}

export interface DataSourceProps {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  kind: DataSourceKind;
  config: DataSourceConfig;
  status: DataSourceStatus;
  lastTestedAt?: Date;
  lastTestError?: string;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

export class DataSource {
  constructor(private props: DataSourceProps) {}

  get id(): number {
    return this.props.id;
  }
  get tenantId(): number {
    return this.props.tenantId;
  }
  get name(): string {
    return this.props.name;
  }
  get description(): string | undefined {
    return this.props.description;
  }
  get kind(): DataSourceKind {
    return this.props.kind;
  }
  get config(): DataSourceConfig {
    return { ...this.props.config };
  }
  get status(): DataSourceStatus {
    return this.props.status;
  }
  get lastTestedAt(): Date | undefined {
    return this.props.lastTestedAt;
  }
  get lastTestError(): string | undefined {
    return this.props.lastTestError;
  }
  get createdBy(): number {
    return this.props.createdBy;
  }

  updateConfig(config: Partial<DataSourceConfig>): void {
    this.props.config = { ...this.props.config, ...config };
    this.props.updatedAt = new Date();
  }

  markTested(success: boolean, error?: string): void {
    this.props.lastTestedAt = new Date();
    this.props.lastTestError = error;
    this.props.status = success ? "active" : "error";
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.status = "active";
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.status = "inactive";
    this.props.updatedAt = new Date();
  }

  toJSON() {
    return { ...this.props };
  }
}
