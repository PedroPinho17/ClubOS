import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '@clubos/database';
import { PrismaService } from '../../prisma/prisma.service';
import { computeQuotaSituation } from '../members/quota.util';
import { daysOverdueFromIso } from './member-quota-report.util';

export interface QuotaReportRow {
  number: string;
  name: string;
  email: string;
  phone: string;
  plan: string;
  situation: string;
  dueDate: string;
  daysOverdue?: number;
}

function formatDatePt(d: Date | null | undefined): string {
  if (!d) return '—';
  return d.toLocaleDateString('pt-PT');
}

@Injectable()
export class MemberQuotaReportService {
  constructor(private readonly prisma: PrismaService) {}

  async payingRows(organizationId: string): Promise<QuotaReportRow[]> {
    return this.rowsByStatus(organizationId, 'up_to_date');
  }

  async overdueRows(organizationId: string): Promise<QuotaReportRow[]> {
    const rows = await this.rowsByStatus(organizationId, 'overdue');
    return rows.sort((a, b) => (b.daysOverdue ?? 0) - (a.daysOverdue ?? 0));
  }

  private async rowsByStatus(
    organizationId: string,
    target: 'up_to_date' | 'overdue',
  ): Promise<QuotaReportRow[]> {
    const members = await this.prisma.member.findMany({
      where: { organizationId, status: 'ACTIVE' },
      include: {
        quotaPlan: true,
        payments: { where: { status: PaymentStatus.PAID }, orderBy: { paidAt: 'desc' }, take: 1 },
      },
      orderBy: { number: 'asc' },
    });

    const rows: QuotaReportRow[] = [];

    for (const m of members) {
      const situation = computeQuotaSituation({
        periodicity: m.quotaPlan?.periodicity,
        joinedAt: m.joinedAt,
        lastPaidAt: m.payments[0]?.paidAt ?? null,
        cardValidUntil: m.cardValidUntil,
      });

      if (situation.status !== target) continue;

      rows.push({
        number: m.number,
        name: m.name,
        email: m.email ?? '',
        phone: m.phone ?? '',
        plan: m.quotaPlan?.name ?? '',
        situation: target === 'up_to_date' ? 'Em dia' : 'Em atraso',
        dueDate: formatDatePt(situation.nextDueDate ? new Date(situation.nextDueDate) : null),
        daysOverdue: target === 'overdue' ? daysOverdueFromIso(situation.nextDueDate) : undefined,
      });
    }

    return rows;
  }
}
