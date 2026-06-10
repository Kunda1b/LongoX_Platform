export interface PolicyEntity { id: string; name: string; scope: string; rules: Record<string, unknown>; isActive: boolean; priority: number; }
