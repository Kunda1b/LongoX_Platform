import type { NotificationRepository } from "../../domain/notification/notification-repository";
import type { Notification } from "../../domain/notification/notification.entity";

export class MarkNotificationReadCommand {
  constructor(private readonly repository: NotificationRepository) {}

  async execute(id: string): Promise<Notification | null> {
    return this.repository.markRead(id);
  }
}
