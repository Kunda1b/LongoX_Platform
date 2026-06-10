import type { NotificationRepository } from "../../domain/notification/notification-repository";
import type {
  Notification,
  ListNotificationsFilter,
} from "../../domain/notification/notification.entity";

export class ListNotificationsQuery {
  constructor(private readonly repository: NotificationRepository) {}

  async execute(filter: ListNotificationsFilter): Promise<Notification[]> {
    return this.repository.list(filter);
  }
}
