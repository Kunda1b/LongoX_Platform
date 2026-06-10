import type {
  Notification,
  CreateNotificationInput,
  ListNotificationsFilter,
} from "./notification.entity";

export interface NotificationRepository {
  list(filter: ListNotificationsFilter): Promise<Notification[]>;
  create(input: CreateNotificationInput): Promise<Notification>;
  markRead(id: number): Promise<Notification | null>;
}
