import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { EMAIL_SENDER, type EmailSenderPort } from "./ports/email-sender.port";

@Injectable()
export class EmailService {
  private readonly appUrl: string;

  constructor(
    @Inject(EMAIL_SENDER) private readonly sender: EmailSenderPort,
    private readonly config: ConfigService
  ) {
    this.appUrl = this.config.get<string>("APP_URL", "http://localhost:3000");
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const link = `${this.appUrl}/verify-email?token=${token}`;
    await this.sender.send({
      to,
      subject: "Verify your email — Messenger",
      text: `Confirm your email address: ${link}\n\nThis link expires in 24 hours.`,
      html: `<p>Confirm your email address:</p><p><a href="${link}">${link}</a></p><p>This link expires in 24 hours.</p>`
    });
  }

  async sendMagicLinkEmail(to: string, token: string): Promise<void> {
    const link = `${this.appUrl}/magic-login?token=${token}`;
    await this.sender.send({
      to,
      subject: "Your Messenger login link",
      text: `Log in here: ${link}\n\nThis link expires in 15 minutes and can only be used once.`,
      html: `<p>Log in here:</p><p><a href="${link}">${link}</a></p><p>This link expires in 15 minutes and can only be used once.</p>`
    });
  }
}
