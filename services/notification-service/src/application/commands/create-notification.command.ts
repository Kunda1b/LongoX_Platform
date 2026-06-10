import type { NotificationRepository } from "../../domain/notification/notification-repository";
import type {
  Notification,
  CreateNotificationInput,
} from "../../domain/notification/notification.entity";

export class CreateNotificationCommand {
  constructor(private readonly repository: NotificationRepository) {}

  async execute(input: CreateNotificationInput): Promise<Notification> {
    if (!input.title?.trim()) {
      throw new Error("title required");
    }
    return this.repository.create(input);
  }
}
