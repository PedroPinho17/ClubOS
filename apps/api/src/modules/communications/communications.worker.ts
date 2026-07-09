import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { Worker, type Job } from 'bullmq';
import { MailService } from '../../core/mail/mail.service';
import { PrismaService } from '../../prisma/prisma.service';
import { redisConnectionOptions } from '../../redis/redis.module';
import { KEY_PREFIX } from '../../redis/redis.constants';
import { COMMUNICATIONS_QUEUE, type CommunicationJobData } from './communications.queue';
import { processCommunicationJob } from './communications.processor';

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
    const comm = await this.prisma.communication.findUnique({
      where: { id: job.data.communicationId },
      include: { organization: { select: { name: true, primaryColor: true } } },
    });

    await processCommunicationJob(
      {
        mail: this.mail,
        prisma: this.prisma,
        branding: comm?.organization,
      },
      job.data,
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}
