import type { UserRecord, UserProfile } from "./user.entity";

export interface UserRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  findProfileById(id: string): Promise<UserProfile | null>;
  updateLastLogin(id: string): Promise<void>;
  isActive(id: string): Promise<boolean>;
}
