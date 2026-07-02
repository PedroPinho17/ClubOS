import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentStatus } from '@clubos/database';
import { PrismaService } from '../../prisma/prisma.service';
import { computeQuotaSituation, type QuotaStatus } from '../members/quota.util';

export interface ValidationResult {
  organization: { name: string; primaryColor: string };
  member: { name: string; number: string; active: boolean };
  status: QuotaStatus;
  validUntil: string | null;
  checkedAt: string;
}

@Injectable()
export class ValidationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validacao publica de um cartao de socio a partir do seu id (do QR).
   * Devolve apenas informacao segura para apresentar a quem valida a porta.
   */
  async validate(memberId: string): Promise<ValidationResult> {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      include: {
        organization: true,
        quotaPlan: true,
        payments: {
          where: { status: PaymentStatus.PAID },
          orderBy: { paidAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!member) {
      throw new NotFoundException('Cartao invalido ou socio inexistente.');
    }

    // Respeita a ativacao do modulo na organizacao.
    const mod = await this.prisma.organizationModule.findFirst({
      where: { organizationId: member.organizationId, module: { slug: 'qr-validation' }, enabled: true },
    });
    if (!mod) {
      throw new NotFoundException('Validacao indisponivel para esta organizacao.');
    }

    const quota = computeQuotaSituation({
      periodicity: member.quotaPlan?.periodicity,
      joinedAt: member.joinedAt,
      lastPaidAt: member.payments[0]?.paidAt ?? null,
      cardValidUntil: member.cardValidUntil,
    });

    const validUntil = member.cardValidUntil?.toISOString() ?? quota.nextDueDate;

    return {
      organization: { name: member.organization.name, primaryColor: member.organization.primaryColor },
      member: { name: member.name, number: member.number, active: member.status === 'ACTIVE' },
      status: quota.status,
      validUntil,
      checkedAt: new Date().toISOString(),
    };
  }
}
