import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";

import { EmailService } from "./application/email.service";
import { EMAIL_SENDER } from "./application/ports/email-sender.port";
import { ConsoleEmailSender } from "./infrastructure/console-email-sender";
import { SmtpEmailSender } from "./infrastructure/smtp-email-sender";

@Module({
  imports: [ConfigModule],
  providers: [
    EmailService,
    {
      provide: EMAIL_SENDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        config.get<string>("EMAIL_PROVIDER", "console") === "smtp"
          ? new SmtpEmailSender(config)
          : new ConsoleEmailSender()
    }
  ],
  exports: [EmailService]
})
export class EmailModule {}
