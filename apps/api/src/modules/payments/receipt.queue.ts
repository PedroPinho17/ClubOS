import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import { redisConnectionOptions } from '../../redis/redis.module';
import { KEY_PREFIX, RECEIPT_QUEUE } from '../../redis/redis.constants';

export interface ReceiptJobData {
  paymentId: string;
  organizationId: string;
}

/**
 * Fila BullMQ para geracao assincrona de recibos.
 *
 * Boas praticas:
 * - Ligacao dedicada para a Queue (o BullMQ recomenda ligacoes separadas de
 *   Queue/Worker por causa dos blocking commands).
 * - `prefix` consistente (clubos:bull:...) para namespacing das chaves.
 * - Jobs com retry exponencial e limpeza automatica (removeOnComplete/Fail)
 *   para nao crescer memoria indefinidamente.
 */
@Injectable()
export class ReceiptQueue implements OnModuleDestroy {
  private readonly logger = new Logger(ReceiptQueue.name);
  readonly queue = new Queue<ReceiptJobData>(RECEIPT_QUEUE, {
    connection: redisConnectionOptions(),
    prefix: `${KEY_PREFIX}:bull`,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2_000 },
      removeOnComplete: { age: 3_600, count: 1_000 },
      removeOnFail: { age: 24 * 3_600 },
    },
  });

  async enqueue(data: ReceiptJobData): Promise<string> {
    const job = await this.queue.add('generate-receipt', data, {
      jobId: `receipt-${data.paymentId}`,
    });
    this.logger.log(`Job de recibo enfileirado (payment=${data.paymentId}, job=${job.id})`);
    return job.id!;
  }

  async getStatus(paymentId: string): Promise<string> {
    const job = await this.queue.getJob(`receipt-${paymentId}`);
    if (!job) return 'not_found';
    return job.getState();
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
  }
}
