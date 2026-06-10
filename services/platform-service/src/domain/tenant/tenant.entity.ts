export interface PlatformTenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  regionPolicy: string;
  status: "active" | "suspended" | "cancelled";
  settings: Record<string, unknown>;
  createdAt: string;
}
export interface PlatformPolicy {
  id: string;
  name: string;
  scope: "global" | "tenant" | "environment";
  rules: Record<string, unknown>;
  isActive: boolean;
  priority: number;
}
export interface FeatureFlag {
  id: string;
  key: string;
  description?: string;
  isEnabled: boolean;
  tenantOverrides: Record<string, boolean>;
  rules?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
export interface AuditEntry {
  id: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  diffJson?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  occurredAt: string;
}
