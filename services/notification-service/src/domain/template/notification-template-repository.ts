import type {
  NotificationTemplate,
  CreateNotificationTemplateInput,
} from "./notification-template.entity";

export interface NotificationTemplateRepository {
  list(): Promise<NotificationTemplate[]>;
  create(input: CreateNotificationTemplateInput): Promise<NotificationTemplate>;
}
