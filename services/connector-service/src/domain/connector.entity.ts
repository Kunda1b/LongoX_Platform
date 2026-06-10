export type ConnectorCategory = "crm" | "communication" | "payments" | "ai" | "database" | "development" | "data" | "marketing" | "analytics" | "storage" | "other";
export type AuthType = "oauth2" | "apikey" | "basic" | "none";
export type CertificationLevel = "official" | "verified" | "community";
export type ConnectorStatus = "active" | "deprecated" | "disabled";

export interface ConnectorCapabilities {
  actions: boolean;
  pollingTriggers: boolean;
  webhookTriggers: boolean;
  oauth2: boolean;
  apiKey: boolean;
  batching: boolean;
  pagination: boolean;
  fileUpload: boolean;
}

export interface ConnectorAuthConfig {
  authorizationUrl?: string;
  tokenUrl?: string;
  scopes?: string[];
  refreshStrategy?: "automatic" | "manual";
  keyHeader?: string;
  keyPrefix?: string;
  [key: string]: unknown;
}

export interface ConnectorRateLimit {
  requestsPerMinute: number;
  burst: number;
}

export interface ConnectorHealthStatus {
  oauthFailureRate: number;
  apiErrorRate: number;
  avgLatencyMs: number;
  availability: number;
  [key: string]: unknown;
}

export interface ConnectorProps {
  id: number;
  name: string;
  displayName?: string;
  version: string;
  sdkVersion: string;
  category: ConnectorCategory;
  description: string;
  icon: string;
  color: string;
  author: string;
  documentationUrl?: string;
  permissions: string[];
  capabilities: ConnectorCapabilities;
  authType: AuthType;
  authConfig: ConnectorAuthConfig;
  certificationLevel: CertificationLevel;
  rateLimit: ConnectorRateLimit;
  isFeatured: boolean;
  status: ConnectorStatus;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class Connector {
  constructor(private props: ConnectorProps) {}

  get id(): number { return this.props.id; }
  get name(): string { return this.props.name; }
  get displayName(): string | undefined { return this.props.displayName; }
  get version(): string { return this.props.version; }
  get category(): ConnectorCategory { return this.props.category; }
  get authType(): AuthType { return this.props.authType; }
  get certificationLevel(): CertificationLevel { return this.props.certificationLevel; }
  get status(): ConnectorStatus { return this.props.status; }
  get isFeatured(): boolean { return this.props.isFeatured; }
  get capabilities(): ConnectorCapabilities { return { ...this.props.capabilities }; }
  get rateLimit(): ConnectorRateLimit { return { ...this.props.rateLimit }; }
  get healthStatus(): ConnectorHealthStatus | undefined { return this.props.metadata?.healthStatus as ConnectorHealthStatus | undefined; }

  deprecate(): void {
    this.props.status = "deprecated";
    this.props.updatedAt = new Date();
  }

  disable(): void {
    this.props.status = "disabled";
    this.props.updatedAt = new Date();
  }

  updateVersion(version: string): void {
    this.props.version = version;
    this.props.updatedAt = new Date();
  }

  toJSON() {
    return { ...this.props };
  }
}
