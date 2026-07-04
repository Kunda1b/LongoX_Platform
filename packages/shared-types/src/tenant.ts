export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: "free" | "pro" | "enterprise";
  isActive: boolean;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Environment {
  id: string;
  tenantId: string;
  name: "dev" | "staging" | "production";
  promotionPolicy: "auto" | "manual" | "requires_approval";
  createdAt: string;
}

export interface RegionPolicy {
  id: string;
  tenantId: string;
  region: string;
  dataResidency: boolean;
  executionLocality: boolean;
  isPrimary: boolean;
  createdAt: string;
}
