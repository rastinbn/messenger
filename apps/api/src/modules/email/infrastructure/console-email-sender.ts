import { Injectable, Logger } from "@nestjs/common";

import type { EmailSenderPort } from "../application/ports/email-sender.port";

/**
 * Default email "sender" for local dev: logs the email to the server
 * console instead of actually sending it, so verification/magic-link flows
 * are fully testable with zero SMTP setup. Switch EMAIL_PROVIDER=smtp (see
 * SmtpEmailSender) once you have real credentials.
 */
@Injectable()
export class ConsoleEmailSender implements EmailSenderPort {
  private readonly logger = new Logger("Email");

  async send(params: { to: string; subject: string; html: string; text: string }): Promise<void> {
    this.logger.log(
      `\n────────────────────────────────────────\n` +
        `To: ${params.to}\nSubject: ${params.subject}\n\n${params.text}\n` +
        `────────────────────────────────────────`
    );
  }
}
