import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { Worker, type Job } from 'bullmq';
import { redisConnectionOptions } from '../../redis/redis.module';
import { KEY_PREFIX, RECEIPT_QUEUE } from '../../redis/redis.constants';
import { MailService } from '../../core/mail/mail.service';
import { PaymentsService } from './payments.service';
import type { ReceiptJobData } from './receipt.queue';

/**
 * Worker que processa a geracao de recibos:
 * 1) gera o PDF, 2) cacheia no Redis (com TTL), 3) envia por email ao socio.
 *
 * Boas praticas: ligacao dedicada com blocking commands; concorrencia limitada
 * para nao saturar CPU; erros propagados para acionar o retry da fila.
 */
@Injectable()
export class ReceiptWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReceiptWorker.name);
  private worker?: Worker<ReceiptJobData>;

  constructor(
    private readonly payments: PaymentsService,
    private readonly mail: MailService,
  ) {}

  onModuleInit(): void {
    this.worker = new Worker<ReceiptJobData>(
      RECEIPT_QUEUE,
      (job) => this.process(job),
      {
        connection: redisConnectionOptions(),
        prefix: `${KEY_PREFIX}:bull`,
        concurrency: 5,
      },
    );

    this.worker.on('completed', (job) =>
      this.logger.log(`Recibo processado (payment=${job.data.paymentId})`),
    );
    this.worker.on('failed', (job, err) =>
      this.logger.error(`Falha no recibo (payment=${job?.data.paymentId}): ${err.message}`),
    );
  }

  private async process(job: Job<ReceiptJobData>): Promise<void> {
    const { organizationId, paymentId } = job.data;

    const { filename, buffer } = await this.payments.generateReceipt(organizationId, paymentId);
    await this.payments.cacheReceipt(paymentId, buffer);

    const payment = await this.payments.findOne(organizationId, paymentId);
    if (payment.member.email) {
      await this.mail.send({
        to: payment.member.email,
        subject: `Comprovativo de pagamento - ${Number(payment.amount).toFixed(2)} EUR`,
        text:
          `Ola ${payment.member.name},\n\n` +
          `Segue em anexo o comprovativo do seu pagamento.\n\n` +
          `Obrigado.`,
        attachments: [{ filename, content: buffer, contentType: 'application/pdf' }],
      });
    } else {
      this.logger.warn(`Socio ${payment.member.name} sem email; recibo apenas em cache.`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}
