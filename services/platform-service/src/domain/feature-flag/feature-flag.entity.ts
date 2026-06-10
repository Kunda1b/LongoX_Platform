export interface FeatureFlagEntity { id: string; key: string; description?: string; isEnabled: boolean; tenantOverrides: Record<string, boolean>; }
