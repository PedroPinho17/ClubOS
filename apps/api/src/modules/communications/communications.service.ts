import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CommunicationAudience, PaymentStatus } from '@clubos/database';
import { PrismaService } from '../../prisma/prisma.service';
import { computeQuotaSituation } from '../members/quota.util';
import { CommunicationsQueue } from './communications.queue';
import { CreateCommunicationDto } from './dto';

@Injectable()
export class CommunicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: CommunicationsQueue,
  ) {}

  list(organizationId: string) {
    return this.prisma.communication.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const comm = await this.prisma.communication.findFirst({ where: { id, organizationId } });
    if (!comm) throw new NotFoundException('Comunicacao nao encontrada.');
    return comm;
  }

  private async resolveRecipients(
    organizationId: string,
    audience: CommunicationAudience,
    planId?: string,
  ): Promise<{ name: string; email: string }[]> {
    const members = await this.prisma.member.findMany({
      where: {
        organizationId,
        email: { not: null },
        ...(audience === CommunicationAudience.ACTIVE ? { status: 'ACTIVE' } : {}),
        ...(audience === CommunicationAudience.PLAN && planId ? { quotaPlanId: planId } : {}),
      },
      include: {
        quotaPlan: true,
        payments: { where: { status: PaymentStatus.PAID }, orderBy: { paidAt: 'desc' }, take: 1 },
      },
    });

    const filtered =
      audience === CommunicationAudience.OVERDUE
        ? members.filter(
            (m) =>
              computeQuotaSituation({
                periodicity: m.quotaPlan?.periodicity,
                joinedAt: m.joinedAt,
                lastPaidAt: m.payments[0]?.paidAt ?? null,
                cardValidUntil: m.cardValidUntil,
              }).status === 'overdue',
          )
        : members;

    return filtered
      .filter((m) => m.email)
      .map((m) => ({ name: m.name, email: m.email! }));
  }

  async create(organizationId: string, userId: string, dto: CreateCommunicationDto) {
    if (dto.audience === CommunicationAudience.PLAN && !dto.planId) {
      throw new BadRequestException('Indica o plano para a audiencia "PLAN".');
    }
    const recipients = await this.resolveRecipients(organizationId, dto.audience, dto.planId);
    if (recipients.length === 0) {
      throw new BadRequestException('Nenhum destinatario com email para esta audiencia.');
    }

    const comm = await this.prisma.communication.create({
      data: {
        organizationId,
        subject: dto.subject,
        body: dto.body,
        audience: dto.audience,
        planId: dto.planId,
        totalRecipients: recipients.length,
        createdById: userId,
      },
    });

    await this.queue.enqueueMany(
      recipients.map((r) => ({
        communicationId: comm.id,
        organizationId,
        memberName: r.name,
        email: r.email,
        subject: dto.subject,
        body: dto.body,
      })),
    );
    return comm;
  }

  async previewCount(organizationId: string, audience: CommunicationAudience, planId?: string) {
    const recipients = await this.resolveRecipients(organizationId, audience, planId);
    return { count: recipients.length };
  }
}
