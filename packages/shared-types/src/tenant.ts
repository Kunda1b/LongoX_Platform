export interface Tenant {
  id: number;
  name: string;
  slug: string;
  plan: "free" | "pro" | "enterprise";
  isActive: boolean;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Environment {
  id: number;
  tenantId: number;
  name: "dev" | "staging" | "production";
  promotionPolicy: "auto" | "manual" | "requires_approval";
  createdAt: string;
}

export interface RegionPolicy {
  id: number;
  tenantId: number;
  region: string;
  dataResidency: boolean;
  executionLocality: boolean;
  isPrimary: boolean;
  createdAt: string;
}
