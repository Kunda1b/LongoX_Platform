export type InstallationStatus = "installing" | "active" | "error" | "removed";

export interface ConnectorInstallationProps {
  id: string;
  tenantId: string;
  connectorId: string;
  connectorName: string;
  environmentId?: string;
  status: InstallationStatus;
  config: Record<string, unknown>;
  error?: string;
  installedBy: number;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class ConnectorInstallation {
  constructor(private props: ConnectorInstallationProps) {}

  get id(): number {
    return this.props.id;
  }
  get tenantId(): number {
    return this.props.tenantId;
  }
  get connectorId(): number {
    return this.props.connectorId;
  }
  get connectorName(): string {
    return this.props.connectorName;
  }
  get status(): InstallationStatus {
    return this.props.status;
  }
  get config(): Record<string, unknown> {
    return { ...this.props.config };
  }
  get installedBy(): number {
    return this.props.installedBy;
  }

  activate(): void {
    this.props.status = "active";
    this.props.updatedAt = new Date();
  }

  markError(error: string): void {
    this.props.status = "error";
    this.props.error = error;
    this.props.updatedAt = new Date();
  }

  remove(): void {
    this.props.status = "removed";
    this.props.updatedAt = new Date();
  }

  recordUsage(): void {
    this.props.lastUsedAt = new Date();
  }

  toJSON() {
    return { ...this.props };
  }
}
