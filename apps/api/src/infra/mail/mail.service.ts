import { Inject, Injectable, Logger } from "@nestjs/common";
import nodemailer, { type Transporter } from "nodemailer";
import { ENV } from "../../config/config.module";
import type { Env } from "../../config/env";

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

/**
 * Sends email over SMTP when SMTP_URL is set (Mailpit locally), otherwise logs it.
 * In tests every message is also kept in `outbox` so specs can read codes.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter?: Transporter;
  readonly outbox: MailMessage[] = [];

  constructor(@Inject(ENV) private readonly env: Env) {
    if (env.SMTP_URL) this.transporter = nodemailer.createTransport(env.SMTP_URL);
  }

  async send(message: MailMessage): Promise<void> {
    if (this.env.NODE_ENV === "test") this.outbox.push(message);

    if (!this.transporter) {
      this.logger.log(`Email to ${message.to}: ${message.subject}\n${message.text}`);
      return;
    }

    await this.transporter.sendMail({ from: this.env.MAIL_FROM, ...message });
  }
}
