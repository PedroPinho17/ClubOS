import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import { redisConnectionOptions } from '../../redis/redis.module';
import { KEY_PREFIX } from '../../redis/redis.constants';

export const COMMUNICATIONS_QUEUE = 'communications';

export interface CommunicationJobData {
  communicationId: string;
  organizationId: string;
  memberName: string;
  email: string;
  subject: string;
  body: string;
}

@Injectable()
export class CommunicationsQueue implements OnModuleDestroy {
  private readonly logger = new Logger(CommunicationsQueue.name);
  readonly queue = new Queue<CommunicationJobData>(COMMUNICATIONS_QUEUE, {
    connection: redisConnectionOptions(),
    prefix: `${KEY_PREFIX}:bull`,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 3_000 },
      removeOnComplete: { age: 3_600, count: 2_000 },
      removeOnFail: { age: 24 * 3_600 },
    },
  });

  async enqueueMany(jobs: CommunicationJobData[]): Promise<void> {
    await this.queue.addBulk(jobs.map((data) => ({ name: 'send-email', data })));
    this.logger.log(`Enfileirados ${jobs.length} emails de comunicacao.`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
  }
}
