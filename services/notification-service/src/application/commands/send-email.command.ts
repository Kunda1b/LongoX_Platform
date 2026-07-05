import type { EmailRepository } from "../../domain/email/email-repository";
import type {
  EmailMessage,
  SendEmailInput,
} from "../../domain/email/email.entity";
import type { EmailSender } from "../../infrastructure/email/ses-sender";

export class SendEmailCommand {
  constructor(
    private readonly emailRepository: EmailRepository,
    private readonly emailSender: EmailSender,
  ) {}

  async execute(input: SendEmailInput): Promise<EmailMessage> {
    // Create pending email record
    const email = await this.emailRepository.create(input);

    try {
      // Send via email provider
      const result = await this.emailSender.send(input);

      // Mark as sent
      const sent = await this.emailRepository.markSent(email.id);
      return sent!;
    } catch (error) {
      // Mark as failed
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const failed = await this.emailRepository.markFailed(
        email.id,
        errorMessage,
      );
      return failed!;
    }
  }
}
