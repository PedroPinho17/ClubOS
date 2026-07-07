import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CommunicationAudience, PaymentStatus } from '@clubos/database';
import { PrismaService } from '../../prisma/prisma.service';
import { computeQuotaSituation } from '../members/quota.util';
import { loadOrgReminderSettings } from '../reminders/org-reminder-settings';
import { CommunicationsQueue } from './communications.queue';
import { CreateCommunicationDto, WhatsappLinksDto } from './dto';
import { buildWhatsappUrl, normalizeWhatsappPhone } from './whatsapp.util';

export interface WhatsappLink {
  name: string;
  phone: string;
  url: string;
}

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

  async previewCount(organizationId: string, audience: CommunicationAudience, planId?: string) {
    const email = await this.resolveRecipients(organizationId, audience, planId);
    return { count: email.length };
  }

  async previewWhatsappCount(organizationId: string, audience: CommunicationAudience, planId?: string) {
    const links = await this.resolveWhatsappRecipients(organizationId, audience, planId);
    return { count: links.length };
  }

  async generateWhatsappLinks(
    organizationId: string,
    dto: WhatsappLinksDto,
  ): Promise<{ links: WhatsappLink[] }> {
    if (dto.audience === CommunicationAudience.PLAN && !dto.planId) {
      throw new BadRequestException('Indica o plano para a audiencia "PLAN".');
    }
    const links = await this.resolveWhatsappRecipients(organizationId, dto.audience, dto.planId, dto.body);
    if (links.length === 0) {
      throw new BadRequestException('Nenhum destinatario com telemovel valido para esta audiencia.');
    }
    return { links };
  }

  private async resolveWhatsappRecipients(
    organizationId: string,
    audience: CommunicationAudience,
    planId?: string,
    messageBody?: string,
  ): Promise<WhatsappLink[]> {
    const members = await this.fetchMembersForAudience(organizationId, audience, planId);
    const plainBody = (messageBody ?? '').trim();
    const links: WhatsappLink[] = [];

    for (const m of members) {
      const digits = normalizeWhatsappPhone(m.phone);
      if (!digits) continue;
      const text = `Olá ${m.name},\n\n${plainBody}`;
      links.push({
        name: m.name,
        phone: m.phone ?? digits,
        url: buildWhatsappUrl(digits, text),
      });
    }
    return links;
  }

  private async fetchMembersForAudience(
    organizationId: string,
    audience: CommunicationAudience,
    planId?: string,
  ) {
    const { diasAvisoQuota } = await loadOrgReminderSettings(this.prisma, organizationId);
    const members = await this.prisma.member.findMany({
      where: {
        organizationId,
        ...(audience === CommunicationAudience.ACTIVE ? { status: 'ACTIVE' } : {}),
        ...(audience === CommunicationAudience.PLAN && planId ? { quotaPlanId: planId } : {}),
      },
      include: {
        quotaPlan: true,
        payments: { where: { status: PaymentStatus.PAID }, orderBy: { paidAt: 'desc' }, take: 1 },
      },
    });

    if (audience !== CommunicationAudience.OVERDUE) return members;

    return members.filter(
      (m) =>
        computeQuotaSituation({
          periodicity: m.quotaPlan?.periodicity,
          joinedAt: m.joinedAt,
          lastPaidAt: m.payments[0]?.paidAt ?? null,
          cardValidUntil: m.cardValidUntil,
          dueSoonDays: diasAvisoQuota,
        }).status === 'overdue',
    );
  }

  private async resolveRecipients(
    organizationId: string,
    audience: CommunicationAudience,
    planId?: string,
  ): Promise<{ name: string; email: string }[]> {
    const members = await this.fetchMembersForAudience(organizationId, audience, planId);

    return members
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
}
