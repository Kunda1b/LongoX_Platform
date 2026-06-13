import type {
  EmailMessage,
  SendEmailInput,
  ListEmailsFilter,
} from "./email.entity";

export interface EmailRepository {
  list(filter: ListEmailsFilter): Promise<EmailMessage[]>;
  create(input: SendEmailInput): Promise<EmailMessage>;
  markSent(id: number): Promise<EmailMessage | null>;
  markFailed(id: number, errorMessage: string): Promise<EmailMessage | null>;
}
