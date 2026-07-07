import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '@clubos/database';
import { PrismaService } from '../../prisma/prisma.service';
import { computeQuotaSituation } from '../members/quota.util';
import { loadOrgReminderSettings } from '../reminders/org-reminder-settings';

function csvCell(value: unknown): string {
  const s = value == null ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  getOrganizationName(organizationId: string) {
    return this.prisma.organization
      .findUnique({ where: { id: organizationId }, select: { name: true } })
      .then((o) => o?.name ?? 'Organização');
  }

  async overview(organizationId: string) {
    const members = await this.prisma.member.findMany({
      where: { organizationId },
      include: {
        quotaPlan: true,
        payments: { where: { status: PaymentStatus.PAID }, orderBy: { paidAt: 'desc' }, take: 1 },
      },
    });

    const { diasAvisoQuota } = await loadOrgReminderSettings(this.prisma, organizationId);

    const quotaBreakdown = { up_to_date: 0, due_soon: 0, overdue: 0, pending: 0, no_plan: 0 };
    const byPlan = new Map<string, number>();
    let active = 0;

    for (const m of members) {
      if (m.status === 'ACTIVE') active++;
      const q = computeQuotaSituation({
        periodicity: m.quotaPlan?.periodicity,
        joinedAt: m.joinedAt,
        lastPaidAt: m.payments[0]?.paidAt ?? null,
        cardValidUntil: m.cardValidUntil,
        dueSoonDays: diasAvisoQuota,
      });
      quotaBreakdown[q.status]++;
      const planName = m.quotaPlan?.name ?? 'Sem plano';
      byPlan.set(planName, (byPlan.get(planName) ?? 0) + 1);
    }

    const paidPayments = await this.prisma.payment.findMany({
      where: { organizationId, status: PaymentStatus.PAID },
      select: { amount: true, paidAt: true, createdAt: true },
    });

    const revenueTotal = paidPayments.reduce((acc, p) => acc + Number(p.amount), 0);
    const months: { month: string; total: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        total: 0,
      });
    }
    const monthIndex = new Map(months.map((m, i) => [m.month, i]));
    for (const p of paidPayments) {
      const when = p.paidAt ?? p.createdAt;
      const key = `${when.getFullYear()}-${String(when.getMonth() + 1).padStart(2, '0')}`;
      const idx = monthIndex.get(key);
      if (idx !== undefined) months[idx].total += Number(p.amount);
    }

    return {
      members: { total: members.length, active, inactive: members.length - active },
      quotaBreakdown,
      revenue: { total: revenueTotal, paymentsCount: paidPayments.length, monthly: months },
      membersByPlan: Array.from(byPlan.entries()).map(([plan, count]) => ({ plan, count })),
    };
  }

  async membersCsv(organizationId: string): Promise<string> {
    const { diasAvisoQuota } = await loadOrgReminderSettings(this.prisma, organizationId);
    const members = await this.prisma.member.findMany({
      where: { organizationId },
      include: {
        quotaPlan: true,
        payments: { where: { status: PaymentStatus.PAID }, orderBy: { paidAt: 'desc' }, take: 1 },
      },
      orderBy: { number: 'asc' },
    });
    const rows = members.map((m) => {
      const q = computeQuotaSituation({
        periodicity: m.quotaPlan?.periodicity,
        joinedAt: m.joinedAt,
        lastPaidAt: m.payments[0]?.paidAt ?? null,
        cardValidUntil: m.cardValidUntil,
        dueSoonDays: diasAvisoQuota,
      });
      return [m.number, m.name, m.email ?? '', m.phone ?? '', m.status, m.quotaPlan?.name ?? '', q.status];
    });
    return toCsv(['Numero', 'Nome', 'Email', 'Telefone', 'Estado', 'Plano', 'Quota'], rows);
  }

  async paymentsCsv(organizationId: string): Promise<string> {
    const payments = await this.prisma.payment.findMany({
      where: { organizationId },
      include: { member: true, quotaPlan: true },
      orderBy: { createdAt: 'desc' },
    });
    const rows = payments.map((p) => [
      (p.paidAt ?? p.createdAt).toISOString().slice(0, 10),
      p.member.number,
      p.member.name,
      Number(p.amount).toFixed(2),
      p.method,
      p.status,
      p.quotaPlan?.name ?? '',
    ]);
    return toCsv(['Data', 'NumSocio', 'Socio', 'Valor', 'Metodo', 'Estado', 'Plano'], rows);
  }
}
