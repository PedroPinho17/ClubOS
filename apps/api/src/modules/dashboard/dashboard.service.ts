import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '@clubos/database';
import { PrismaService } from '../../prisma/prisma.service';
import { computeQuotaSituation } from '../members/quota.util';
import { loadOrgReminderSettings } from '../reminders/org-reminder-settings';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async stats(organizationId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [members, activeMembers, payments, revenue, revenueThisMonth, revenuePrevMonth, recentPayments, membersWithQuota] =
      await Promise.all([
        this.prisma.member.count({ where: { organizationId } }),
        this.prisma.member.count({ where: { organizationId, status: 'ACTIVE' } }),
        this.prisma.payment.count({ where: { organizationId, status: PaymentStatus.PAID } }),
        this.prisma.payment.aggregate({
          where: { organizationId, status: PaymentStatus.PAID },
          _sum: { amount: true },
        }),
        this.prisma.payment.aggregate({
          where: {
            organizationId,
            status: PaymentStatus.PAID,
            paidAt: { gte: monthStart },
          },
          _sum: { amount: true },
        }),
        this.prisma.payment.aggregate({
          where: {
            organizationId,
            status: PaymentStatus.PAID,
            paidAt: { gte: prevMonthStart, lt: monthStart },
          },
          _sum: { amount: true },
        }),
        this.prisma.payment.findMany({
          where: { organizationId, status: PaymentStatus.PAID },
          orderBy: { paidAt: 'desc' },
          take: 5,
          select: {
            id: true,
            amount: true,
            paidAt: true,
            createdAt: true,
            member: { select: { name: true, number: true } },
          },
        }),
        this.prisma.member.findMany({
          where: { organizationId, status: 'ACTIVE' },
          select: {
            joinedAt: true,
            cardValidUntil: true,
            quotaPlan: { select: { periodicity: true } },
            payments: {
              where: { status: PaymentStatus.PAID },
              orderBy: { paidAt: 'desc' },
              take: 1,
              select: { paidAt: true },
            },
          },
        }),
      ]);

    const { diasAvisoQuota } = await loadOrgReminderSettings(this.prisma, organizationId);
    let overdue = 0;
    let dueSoon = 0;
    for (const m of membersWithQuota) {
      const q = computeQuotaSituation({
        periodicity: m.quotaPlan?.periodicity,
        joinedAt: m.joinedAt,
        lastPaidAt: m.payments[0]?.paidAt ?? null,
        cardValidUntil: m.cardValidUntil,
        dueSoonDays: diasAvisoQuota,
      });
      if (q.status === 'overdue') overdue++;
      else if (q.status === 'due_soon') dueSoon++;
    }

    const thisMonth = Number(revenueThisMonth._sum.amount ?? 0);
    const prevMonth = Number(revenuePrevMonth._sum.amount ?? 0);

    return {
      members,
      activeMembers,
      payments,
      revenue: Number(revenue._sum.amount ?? 0),
      overdue,
      dueSoon,
      revenueThisMonth: thisMonth,
      revenuePrevMonth: prevMonth,
      revenueMonthChangePct:
        prevMonth > 0 ? Math.round(((thisMonth - prevMonth) / prevMonth) * 1000) / 10 : null,
      recentPayments: recentPayments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        paidAt: (p.paidAt ?? p.createdAt).toISOString(),
        memberName: p.member.name,
        memberNumber: p.member.number,
      })),
    };
  }
}
