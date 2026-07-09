import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentStatus } from '@clubos/database';
import type { Redis } from 'ioredis';
import { PrismaService } from '../../prisma/prisma.service';
import { REDIS_CLIENT, RECEIPT_CACHE_TTL_SECONDS, receiptCacheKey } from '../../redis/redis.constants';
import { CreatePaymentDto } from './dto';
import { ReceiptQueue } from './receipt.queue';
import { ReceiptService, type ReceiptData } from './receipt.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly receipts: ReceiptService,
    private readonly receiptQueue: ReceiptQueue,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  list(organizationId: string) {
    return this.prisma.payment.findMany({
      where: { organizationId },
      include: { member: true, quotaPlan: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, organizationId },
      include: {
        member: true,
        quotaPlan: true,
        organization: { select: { name: true, primaryColor: true } },
      },
    });
    if (!payment) {
      throw new NotFoundException('Pagamento nao encontrado.');
    }
    return payment;
  }

  async create(organizationId: string, dto: CreatePaymentDto) {
    // Garante que o socio pertence a organizacao.
    const member = await this.prisma.member.findFirst({
      where: { id: dto.memberId, organizationId },
    });
    if (!member) {
      throw new BadRequestException('Socio invalido para esta organizacao.');
    }

    // Resolve plano e valor: se nao vier valor, usa o do plano.
    const quotaPlanId = dto.quotaPlanId ?? member.quotaPlanId ?? undefined;
    let amount = dto.amount;
    if (amount === undefined && quotaPlanId) {
      const plan = await this.prisma.quotaPlan.findFirst({
        where: { id: quotaPlanId, organizationId },
      });
      amount = plan ? Number(plan.amount) : undefined;
    }
    if (amount === undefined) {
      throw new BadRequestException('Valor em falta (indica um valor ou um plano com valor).');
    }

    const status = dto.status ?? PaymentStatus.PAID;
    const payment = await this.prisma.payment.create({
      data: {
        organizationId,
        memberId: dto.memberId,
        quotaPlanId,
        amount,
        method: dto.method,
        status,
        reference: dto.reference,
        paidAt: status === PaymentStatus.PAID ? new Date() : null,
      },
      include: { member: true, quotaPlan: true },
    });

    // Gera o recibo (PDF) e envia o email em background via BullMQ.
    if (status === PaymentStatus.PAID) {
      void Promise.race([
        this.receiptQueue.enqueue({ organizationId, paymentId: payment.id }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Redis timeout ao enfileirar recibo')), 3_000),
        ),
      ]).catch(() => {
        // Redis indisponivel nao deve bloquear o registo do pagamento.
      });
    }

    return payment;
  }

  /** Le o PDF do recibo do cache Redis (Buffer) ou null se ausente/expirado. */
  async getCachedReceipt(paymentId: string): Promise<Buffer | null> {
    return this.redis.getBuffer(receiptCacheKey(paymentId));
  }

  /** Guarda o PDF do recibo no cache Redis com TTL. */
  async cacheReceipt(paymentId: string, buffer: Buffer): Promise<void> {
    await this.redis.set(
      receiptCacheKey(paymentId),
      buffer,
      'EX',
      RECEIPT_CACHE_TTL_SECONDS,
    );
  }

  /** Estado do job de geracao do recibo. */
  getReceiptStatus(paymentId: string): Promise<string> {
    return this.receiptQueue.getStatus(paymentId);
  }

  /** Devolve o recibo servindo do cache Redis quando disponivel. */
  async getReceipt(organizationId: string, id: string): Promise<{ filename: string; buffer: Buffer }> {
    const payment = await this.findOne(organizationId, id); // valida ownership
    const number = payment.reference ?? payment.id.slice(-8).toUpperCase();
    const filename = `recibo-${number}.pdf`;

    const cached = await this.getCachedReceipt(id);
    if (cached) {
      return { filename, buffer: cached };
    }

    const result = await this.generateReceipt(organizationId, id);
    await this.cacheReceipt(id, result.buffer);
    return result;
  }

  /** Gera o comprovativo PDF de um pagamento. */
  async generateReceipt(organizationId: string, id: string): Promise<{ filename: string; buffer: Buffer }> {
    const payment = await this.findOne(organizationId, id);
    const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });

    const data: ReceiptData = {
      organizationName: org?.name ?? 'Organizacao',
      organizationColor: org?.primaryColor,
      receiptNumber: payment.reference ?? payment.id.slice(-8).toUpperCase(),
      date: payment.paidAt ?? payment.createdAt,
      memberName: payment.member.name,
      memberNumber: payment.member.number,
      planName: payment.quotaPlan?.name,
      amount: Number(payment.amount),
      method: payment.method,
      status: payment.status,
    };

    const buffer = await this.receipts.generate(data);
    return { filename: `recibo-${data.receiptNumber}.pdf`, buffer };
  }
}
