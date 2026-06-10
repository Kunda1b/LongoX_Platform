import type { NotificationTemplateRepository } from "../../domain/template/notification-template-repository";
import type { NotificationTemplate } from "../../domain/template/notification-template.entity";

export class ListNotificationTemplatesQuery {
  constructor(private readonly repository: NotificationTemplateRepository) {}

  async execute(): Promise<NotificationTemplate[]> {
    return this.repository.list();
  }
}
