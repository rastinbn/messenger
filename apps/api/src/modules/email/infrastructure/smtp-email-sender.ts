import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createTransport, type Transporter } from "nodemailer";

import type { EmailSenderPort } from "../application/ports/email-sender.port";

/**
 * Real SMTP delivery via nodemailer. Activate with EMAIL_PROVIDER=smtp and
 * fill in SMTP_HOST/PORT/USER/PASS/FROM in .env. Works with any standard
 * SMTP provider (SendGrid, Postmark, Mailgun, Gmail app-password, etc.) —
 * nothing provider-specific is hardcoded here.
 */
@Injectable()
export class SmtpEmailSender implements EmailSenderPort {
  private transporter: Transporter;
  private readonly fromAddress: string;

  constructor(private readonly config: ConfigService) {
    this.transporter = createTransport({
      host: this.config.getOrThrow<string>("SMTP_HOST"),
      port: this.config.get<number>("SMTP_PORT", 587),
      secure: this.config.get<number>("SMTP_PORT", 587) === 465,
      auth: {
        user: this.config.getOrThrow<string>("SMTP_USER"),
        pass: this.config.getOrThrow<string>("SMTP_PASS")
      }
    });
    this.fromAddress = this.config.get<string>("SMTP_FROM", "Messenger <no-reply@messenger.local>");
  }

  async send(params: { to: string; subject: string; html: string; text: string }): Promise<void> {
    await this.transporter.sendMail({
      from: this.fromAddress,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text
    });
  }
}
