export interface User {
  id: string;
  email: string;
  name: string;
  tenantId: string | null;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  tenantId: string | null;
  role: string;
}

export interface Membership {
  id: string;
  userId: string;
  tenantId: string;
  roleId: string;
  invitedBy: string | null;
  createdAt: string;
}
