import { Injectable, NotFoundException } from '@nestjs/common';
import { buildSignedValidationUrl } from '../../common/qr-signature';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { computeQuotaSituation } from '../members/quota.util';
import {
  CARD_CATALOG,
  type CardLayout,
  resolveCardLayout,
} from './card-layout';
import { UpdateCardSettingsDto } from './dto';

const CARD_LAYOUT_KEY = 'card.layout';

@Injectable()
export class CardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  private async getOrg(organizationId: string) {
    const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) throw new NotFoundException('Organizacao nao encontrada.');
    return org;
  }

  async getLayout(organizationId: string): Promise<CardLayout> {
    const org = await this.getOrg(organizationId);
    const setting = await this.prisma.organizationSetting.findUnique({
      where: { organizationId_key: { organizationId, key: CARD_LAYOUT_KEY } },
    });
    return resolveCardLayout(org, (setting?.value as Partial<CardLayout>) ?? null);
  }

  async getSettings(organizationId: string) {
    const layout = await this.getLayout(organizationId);
    return { layout, catalog: CARD_CATALOG };
  }

  async updateSettings(organizationId: string, dto: UpdateCardSettingsDto) {
    const org = await this.getOrg(organizationId);
    const current = await this.getLayout(organizationId);
    // Merge do atual com as alteracoes e re-valida (CRC Vale so se ativado).
    const next = resolveCardLayout(org, { ...current, ...dto });
    await this.prisma.organizationSetting.upsert({
      where: { organizationId_key: { organizationId, key: CARD_LAYOUT_KEY } },
      update: { value: next as never },
      create: { organizationId, key: CARD_LAYOUT_KEY, value: next as never },
    });
    return { layout: next, catalog: CARD_CATALOG };
  }

  /** Constroi os dados necessarios para renderizar o cartao de um socio. */
  async getCardData(organizationId: string, memberId: string) {
    const org = await this.getOrg(organizationId);
    const layout = await this.getLayout(organizationId);

    const member = await this.prisma.member.findFirst({
      where: { id: memberId, organizationId },
      include: {
        quotaPlan: true,
        payments: {
          where: { status: 'PAID' },
          orderBy: { paidAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!member) throw new NotFoundException('Socio nao encontrado.');

    const lastPaidAt = member.payments[0]?.paidAt ?? null;
    const quota = computeQuotaSituation({
      periodicity: member.quotaPlan?.periodicity,
      joinedAt: member.joinedAt,
      lastPaidAt,
      cardValidUntil: member.cardValidUntil,
    });

    // Texto de validade (templates base).
    let validityText: string | null = null;
    if (member.cardValidUntil) {
      validityText = `Válido até ${member.cardValidUntil.toLocaleDateString('pt-PT')}`;
    } else if (quota.nextDueDate) {
      validityText = `Próximo vencimento: ${new Date(quota.nextDueDate).toLocaleDateString('pt-PT')}`;
    }

    // Periodo (template CRC Vale): ano/ano+1.
    const refDate = member.cardValidUntil ?? (quota.nextDueDate ? new Date(quota.nextDueDate) : new Date());
    const year = refDate.getFullYear();
    const validadePeriodo = `${year}/${year + 1}`;

    const numeroFormatado = `${layout.numeroPrefix ?? ''}${member.number}`;

    const qrExpiresAt =
      member.cardValidUntil ?? (quota.nextDueDate ? new Date(quota.nextDueDate) : null);

    const qrPayload = this.buildQrPayload(layout.qrContent, {
      organizationName: org.name,
      memberId: member.id,
      numeroFormatado,
      name: member.name,
      qrExpiresAt,
    });

    return {
      layout,
      catalog: CARD_CATALOG,
      organization: {
        name: org.name,
        primaryColor: org.primaryColor,
        logoUrl: await this.storage.getUrl(org.logoKey),
      },
      member: {
        id: member.id,
        name: member.name,
        number: member.number,
        email: member.email,
        phone: member.phone,
        cardRole: member.cardRole,
        status: member.status,
        joinedAt: member.joinedAt.toISOString(),
        planName: member.quotaPlan?.name ?? null,
        photoUrl: await this.storage.getUrl(member.photoKey),
      },
      numeroFormatado,
      validityText,
      validadePeriodo,
      quotaStatus: quota.status,
      active: member.status === 'ACTIVE',
      qrPayload,
    };
  }

  private buildQrPayload(
    qrContent: CardLayout['qrContent'],
    ctx: {
      organizationName: string;
      memberId: string;
      numeroFormatado: string;
      name: string;
      qrExpiresAt: Date | null;
    },
  ): string {
    switch (qrContent) {
      case 'numero':
        return ctx.numeroFormatado;
      case 'dados':
        return JSON.stringify({ clube: ctx.organizationName, numero: ctx.numeroFormatado, nome: ctx.name });
      case 'validacao':
      default:
        return buildSignedValidationUrl(ctx.memberId, ctx.qrExpiresAt);
    }
  }
}
