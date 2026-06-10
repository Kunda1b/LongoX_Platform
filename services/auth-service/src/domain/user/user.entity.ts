export interface AuthUser {
  id: number;
  email: string;
  name: string;
  tenantId: number | null;
  role: string;
}

export interface UserRecord extends AuthUser {
  passwordHash: string;
  isActive: boolean;
}

export interface UserProfile {
  id: number;
  email: string;
  name: string;
  role: string;
  tenantId: number | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export interface Credentials {
  email: string;
  password: string;
}
