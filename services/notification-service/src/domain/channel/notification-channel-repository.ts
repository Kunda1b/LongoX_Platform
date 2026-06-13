import type {
  NotificationChannel,
  CreateChannelInput,
  UpdateChannelInput,
} from "./notification-channel.entity";

export interface NotificationChannelRepository {
  list(tenantId: string): Promise<NotificationChannel[]>;
  getById(id: string): Promise<NotificationChannel | null>;
  create(input: CreateChannelInput): Promise<NotificationChannel>;
  update(id: string, input: UpdateChannelInput): Promise<NotificationChannel | null>;
  delete(id: string): Promise<boolean>;
}
