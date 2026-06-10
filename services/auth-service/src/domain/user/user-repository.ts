import type { UserRecord, UserProfile } from "./user.entity";

export interface UserRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
  findProfileById(id: number): Promise<UserProfile | null>;
  updateLastLogin(id: number): Promise<void>;
  isActive(id: number): Promise<boolean>;
}
