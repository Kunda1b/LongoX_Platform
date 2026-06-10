export interface User {
  id: number;
  email: string;
  name: string;
  tenantId: number | null;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  tenantId: number | null;
  role: string;
}

export interface Membership {
  id: number;
  userId: number;
  tenantId: number;
  roleId: number;
  invitedBy: string | null;
  createdAt: string;
}
