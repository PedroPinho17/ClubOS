import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface MailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface SendMailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: MailAttachment[];
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;
  private readonly devMode: boolean;

  constructor() {
    this.from = process.env.MAIL_FROM ?? 'ClubOS <no-reply@clubos.local>';
    const host = process.env.SMTP_HOST;

    if (host) {
      this.devMode = false;
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });
    } else {
      // Sem SMTP configurado: transporte "json" (nao envia, apenas serializa).
      // Util em desenvolvimento para nao bloquear o fluxo.
      this.devMode = true;
      this.transporter = nodemailer.createTransport({ jsonTransport: true });
    }
  }

  async send(options: SendMailOptions): Promise<void> {
    const info = await this.transporter.sendMail({
      from: this.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    });

    if (this.devMode) {
      this.logger.log(
        `[DEV] Email simulado para ${options.to} | assunto: "${options.subject}"` +
          (options.attachments?.length ? ` | anexos: ${options.attachments.length}` : ''),
      );
    } else {
      this.logger.log(`Email enviado para ${options.to} (id: ${info.messageId})`);
    }
  }
}
