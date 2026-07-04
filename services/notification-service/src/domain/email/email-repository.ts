import type {
  EmailMessage,
  SendEmailInput,
  ListEmailsFilter,
} from "./email.entity";

export interface EmailRepository {
  list(filter: ListEmailsFilter): Promise<EmailMessage[]>;
  create(input: SendEmailInput): Promise<EmailMessage>;
  markSent(id: string): Promise<EmailMessage | null>;
  markFailed(id: string, errorMessage: string): Promise<EmailMessage | null>;
}
