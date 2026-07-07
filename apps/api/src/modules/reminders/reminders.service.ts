import { Injectable, Logger } from '@nestjs/common';
import { OrganizationStatus, PaymentStatus, QuotaReminderKind } from '@clubos/database';
import { pingQuotaRemindersHealthcheck } from '../../common/healthcheck';
import { MailService } from '../../core/mail/mail.service';
import { PrismaService } from '../../prisma/prisma.service';
import { computeQuotaSituation } from '../members/quota.util';
import {
  loadOrgReminderSettings,
  periodReferenceFromDueDate,
} from './org-reminder-settings';

export interface ReminderRunResult {
  organizationId: string;
  organizationName: string;
  dueSoonSent: number;
  overdueSent: number;
  skipped: number;
  errors: string[];
}

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async runForAllOrganizations(): Promise<ReminderRunResult[]> {
    const orgs = await this.prisma.organization.findMany({
      where: { status: { in: [OrganizationStatus.ACTIVE, OrganizationStatus.TRIAL] } },
      select: { id: true, name: true },
    });

    const results: ReminderRunResult[] = [];
    for (const org of orgs) {
      results.push(await this.runForOrganization(org.id));
    }

    await pingQuotaRemindersHealthcheck();
    return results;
  }

  async runForOrganization(organizationId: string): Promise<ReminderRunResult> {
    const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) {
      return emptyResult(organizationId, '—', ['Organizacao nao encontrada.']);
    }

    const settings = await loadOrgReminderSettings(this.prisma, organizationId);
    const result = emptyResult(organizationId, org.name);

    if (!settings.lembretesAutomaticos) {
      this.logger.log(`Lembretes desactivados para ${org.name}`);
      return result;
    }

    const members = await this.prisma.member.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
        email: { not: null },
        quotaPlanId: { not: null },
      },
      include: {
        quotaPlan: true,
        payments: {
          where: { status: PaymentStatus.PAID },
          orderBy: { paidAt: 'desc' },
          take: 1,
        },
      },
    });

    const origin = (process.env.WEB_ORIGIN ?? 'http://localhost:3000').split(',')[0].trim();

    for (const member of members) {
      const situation = computeQuotaSituation({
        periodicity: member.quotaPlan?.periodicity,
        joinedAt: member.joinedAt,
        lastPaidAt: member.payments[0]?.paidAt ?? null,
        cardValidUntil: member.cardValidUntil,
        dueSoonDays: settings.diasAvisoQuota,
      });

      if (situation.status !== 'due_soon' && situation.status !== 'overdue') continue;
      if (!situation.nextDueDate) continue;

      const kind =
        situation.status === 'due_soon' ? QuotaReminderKind.DUE_SOON : QuotaReminderKind.OVERDUE;
      const periodReference = periodReferenceFromDueDate(situation.nextDueDate);

      const already = await this.prisma.quotaReminderSent.findUnique({
        where: {
          memberId_periodReference_kind: { memberId: member.id, periodReference, kind },
        },
      });
      if (already) {
        result.skipped++;
        continue;
      }

      const email = member.email!;
      const dueLabel = new Date(situation.nextDueDate).toLocaleDateString('pt-PT');

      const subject =
        kind === QuotaReminderKind.DUE_SOON
          ? `A sua quota vence em breve — ${org.name}`
          : `Quota em atraso — ${org.name}`;

      const days =
        kind === QuotaReminderKind.DUE_SOON
          ? (situation.daysUntilDue ?? 0)
          : (situation.daysOverdue ?? 0);

      const bodyIntro =
        kind === QuotaReminderKind.DUE_SOON
          ? `A sua quota em ${org.name} vence em ${days} dia(s).\nData de vencimento: ${dueLabel}`
          : `A sua quota em ${org.name} encontra-se em atraso há ${days} dia(s).\nVencimento: ${dueLabel}`;

      try {
        await this.mail.send({
          to: email,
          subject,
          text:
            `Ola ${member.name},\n\n` +
            `${bodyIntro}\n\n` +
            `Por favor regularize a situacao o mais breve possivel.\n` +
            `Portal do socio: ${origin}/portal\n\n` +
            `Com os melhores cumprimentos,\n${org.name}`,
        });

        await this.prisma.quotaReminderSent.create({
          data: {
            organizationId,
            memberId: member.id,
            periodReference,
            kind,
          },
        });

        if (kind === QuotaReminderKind.DUE_SOON) result.dueSoonSent++;
        else result.overdueSent++;
      } catch (e) {
        result.errors.push(`${member.name}: ${(e as Error).message}`);
      }
    }

    this.logger.log(
      `Lembretes ${org.name}: due_soon=${result.dueSoonSent}, overdue=${result.overdueSent}, ` +
        `ignorados=${result.skipped}, erros=${result.errors.length}`,
    );

    return result;
  }
}

function emptyResult(
  organizationId: string,
  organizationName: string,
  errors: string[] = [],
): ReminderRunResult {
  return {
    organizationId,
    organizationName,
    dueSoonSent: 0,
    overdueSent: 0,
    skipped: 0,
    errors,
  };
}
