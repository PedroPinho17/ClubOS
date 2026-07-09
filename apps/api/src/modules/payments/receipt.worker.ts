import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { Worker, type Job } from 'bullmq';
import { redisConnectionOptions } from '../../redis/redis.module';
import { KEY_PREFIX, RECEIPT_QUEUE } from '../../redis/redis.constants';
import { MailService } from '../../core/mail/mail.service';
import { receiptPaymentEmail } from '../../core/mail/templates/receipt-payment';
import { PaymentsService } from './payments.service';
import type { ReceiptJobData } from './receipt.queue';

export interface ReceiptWorkerDeps {
  payments: Pick<PaymentsService, 'generateReceipt' | 'cacheReceipt' | 'findOne'>;
  mail: Pick<MailService, 'send'>;
  logger?: Pick<Logger, 'warn'>;
}

type PaymentWithOrg = Awaited<ReturnType<PaymentsService['findOne']>>;

/** Logica de processamento do job de recibo (testavel sem BullMQ). */
export async function processReceiptJob(
  deps: ReceiptWorkerDeps,
  data: ReceiptJobData,
  paymentOverride?: PaymentWithOrg,
): Promise<void> {
  const { organizationId, paymentId } = data;

  const { filename, buffer } = await deps.payments.generateReceipt(organizationId, paymentId);
  await deps.payments.cacheReceipt(paymentId, buffer);

  const payment = paymentOverride ?? (await deps.payments.findOne(organizationId, paymentId));
  if (payment.member.email) {
    const rendered = receiptPaymentEmail({
      branding: {
        name: payment.organization.name,
        primaryColor: payment.organization.primaryColor,
      },
      memberName: payment.member.name,
      amount: Number(payment.amount).toFixed(2),
    });
    await deps.mail.send({
      to: payment.member.email,
      subject: `Comprovativo de pagamento - ${Number(payment.amount).toFixed(2)} EUR`,
      text: rendered.text,
      html: rendered.html,
      attachments: [{ filename, content: buffer, contentType: 'application/pdf' }],
    });
  } else {
    deps.logger?.warn?.(`Socio ${payment.member.name} sem email; recibo apenas em cache.`);
  }
}

/**
 * Worker que processa a geracao de recibos:
 * 1) gera o PDF, 2) cacheia no Redis (com TTL), 3) envia por email ao socio.
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
    await processReceiptJob(
      { payments: this.payments, mail: this.mail, logger: this.logger },
      job.data,
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}
