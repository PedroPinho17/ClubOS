import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { CommunicationStatus } from '@clubos/database';
import { Worker, type Job } from 'bullmq';
import { MailService } from '../../core/mail/mail.service';
import { PrismaService } from '../../prisma/prisma.service';
import { redisConnectionOptions } from '../../redis/redis.module';
import { KEY_PREFIX } from '../../redis/redis.constants';
import { COMMUNICATIONS_QUEUE, type CommunicationJobData } from './communications.queue';

@Injectable()
export class CommunicationsWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CommunicationsWorker.name);
  private worker?: Worker<CommunicationJobData>;

  constructor(
    private readonly mail: MailService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit(): void {
    this.worker = new Worker<CommunicationJobData>(
      COMMUNICATIONS_QUEUE,
      (job) => this.process(job),
      {
        connection: redisConnectionOptions(),
        prefix: `${KEY_PREFIX}:bull`,
        concurrency: 3,
      },
    );
    this.worker.on('failed', (job, err) =>
      this.logger.error(`Falha a enviar email (comm=${job?.data.communicationId}): ${err.message}`),
    );
  }

  private async process(job: Job<CommunicationJobData>): Promise<void> {
    const { communicationId, email, memberName, subject, body } = job.data;
    try {
      await this.mail.send({
        to: email,
        subject,
        text: body,
        html: `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5">
          <p>Olá ${memberName},</p>
          <div>${body.replace(/\n/g, '<br/>')}</div>
        </div>`,
      });
      await this.bump(communicationId, 'sentCount');
    } catch {
      await this.bump(communicationId, 'failedCount');
      throw new Error('Falha no envio');
    }
  }

  private async bump(id: string, field: 'sentCount' | 'failedCount'): Promise<void> {
    const comm = await this.prisma.communication.update({
      where: { id },
      data: { [field]: { increment: 1 }, status: CommunicationStatus.SENDING },
    });
    if (comm.sentCount + comm.failedCount >= comm.totalRecipients) {
      await this.prisma.communication.update({
        where: { id },
        data: {
          status:
            comm.failedCount > 0 && comm.sentCount === 0
              ? CommunicationStatus.FAILED
              : CommunicationStatus.SENT,
        },
      });
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}
