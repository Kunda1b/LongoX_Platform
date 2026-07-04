export interface AuthUser {
  id: string;
  email: string;
  name: string;
  tenantId: string | null;
  role: string;
}

export interface UserRecord extends AuthUser {
  passwordHash: string;
  isActive: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export interface Credentials {
  email: string;
  password: string;
}
