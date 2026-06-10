import type { NotificationTemplateRepository } from "../../domain/template/notification-template-repository";
import type {
  NotificationTemplate,
  CreateNotificationTemplateInput,
} from "../../domain/template/notification-template.entity";

export class CreateNotificationTemplateCommand {
  constructor(private readonly repository: NotificationTemplateRepository) {}

  async execute(
    input: CreateNotificationTemplateInput,
  ): Promise<NotificationTemplate> {
    if (!input.name?.trim() || !input.body?.trim()) {
      throw new Error("name and body required");
    }
    return this.repository.create(input);
  }
}
