import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@clubos/database';
import { PrismaService } from '../../prisma/prisma.service';

export const GDPR_ERASED_NAME = 'Apagado RGPD';

export function isGdprErased(member: { name: string }): boolean {
  return member.name === GDPR_ERASED_NAME;
}

function serializePayment(p: {
  id: string;
  amount: Prisma.Decimal;
  method: string;
  status: string;
  reference: string | null;
  paidAt: Date | null;
  createdAt: Date;
  quotaPlan: { id: string; name: string } | null;
}) {
  return {
    id: p.id,
    amount: p.amount.toString(),
    method: p.method,
    status: p.status,
    reference: p.reference,
    paidAt: p.paidAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    quotaPlan: p.quotaPlan ? { id: p.quotaPlan.id, name: p.quotaPlan.name } : null,
  };
}

@Injectable()
export class MemberGdprService {
  constructor(private readonly prisma: PrismaService) {}

  async buildExport(organizationId: string, memberId: string) {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, organizationId },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        quotaPlan: { select: { id: true, name: true, amount: true, periodicity: true } },
        payments: {
          orderBy: { createdAt: 'desc' },
          include: { quotaPlan: { select: { id: true, name: true } } },
        },
      },
    });
    if (!member) {
      throw new NotFoundException('Membro nao encontrado.');
    }

    const { organization, quotaPlan, payments, ...memberFields } = member;

    return {
      format: 'clubos-gdpr-v1',
      exportedAt: new Date().toISOString(),
      organization,
      member: {
        id: memberFields.id,
        number: memberFields.number,
        name: memberFields.name,
        email: memberFields.email,
        phone: memberFields.phone,
        joinedAt: memberFields.joinedAt.toISOString(),
        status: memberFields.status,
        cardRole: memberFields.cardRole,
        cardValidUntil: memberFields.cardValidUntil?.toISOString() ?? null,
        notes: memberFields.notes,
        portalLinked: Boolean(memberFields.userId),
        gdprErased: isGdprErased(memberFields),
        quotaPlan: quotaPlan
          ? {
              id: quotaPlan.id,
              name: quotaPlan.name,
              amount: quotaPlan.amount.toString(),
              periodicity: quotaPlan.periodicity,
            }
          : null,
      },
      payments: payments.map(serializePayment),
    };
  }

  async erasePersonalData(organizationId: string, memberId: string) {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, organizationId },
      select: { id: true, name: true, userId: true, photoKey: true },
    });
    if (!member) {
      throw new NotFoundException('Membro nao encontrado.');
    }
    if (isGdprErased(member)) {
      throw new BadRequestException('Os dados pessoais deste membro ja foram apagados (RGPD).');
    }

    const portalUserId = member.userId;

    await this.prisma.$transaction(async (tx) => {
      if (portalUserId) {
        await tx.session.deleteMany({ where: { userId: portalUserId } });
        await tx.account.deleteMany({ where: { userId: portalUserId } });
        await tx.passkey.deleteMany({ where: { userId: portalUserId } });
        await tx.user.update({
          where: { id: portalUserId },
          data: {
            name: 'Conta apagada',
            email: `gdpr-erased-${portalUserId}@anon.clubos`,
            image: null,
            banned: true,
            banReason: 'RGPD erase',
          },
        });
      }

      await tx.quotaReminderSent.deleteMany({ where: { memberId } });

      await tx.member.update({
        where: { id: memberId },
        data: {
          name: GDPR_ERASED_NAME,
          email: null,
          phone: null,
          notes: null,
          cardRole: null,
          cardValidUntil: null,
          photoKey: null,
          status: 'INACTIVE',
          userId: null,
        },
      });
    });

    return { success: true, memberId, portalUserAnonymized: Boolean(portalUserId) };
  }
}
