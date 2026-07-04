import type { UserRepository } from "../../domain/user/user-repository";
import type { UserProfile } from "../../domain/user/user.entity";

export class GetCurrentUserQuery {
  constructor(private readonly repository: UserRepository) {}

  async execute(id: string): Promise<UserProfile | null> {
    return this.repository.findProfileById(id);
  }
}
