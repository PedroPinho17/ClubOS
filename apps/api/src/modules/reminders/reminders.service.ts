import { Inject, Injectable, Logger } from '@nestjs/common';
import { OrganizationStatus, PaymentStatus } from '@clubos/database';
import type { Redis } from 'ioredis';
import { MailService } from '../../core/mail/mail.service';
import { PrismaService } from '../../prisma/prisma.service';
import { REDIS_CLIENT } from '../../redis/redis.constants';
import { computeQuotaSituation } from '../members/quota.util';

const REMINDER_TTL_SEC = 7 * 24 * 60 * 60;

export interface ReminderRunResult {
  organizationId: string;
  organizationName: string;
  sent: number;
  skipped: number;
  errors: string[];
}

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
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
    return results;
  }

  async runForOrganization(organizationId: string): Promise<ReminderRunResult> {
    const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) {
      return {
        organizationId,
        organizationName: '—',
        sent: 0,
        skipped: 0,
        errors: ['Organizacao nao encontrada.'],
      };
    }

    const members = await this.prisma.member.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
        email: { not: null },
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

    const result: ReminderRunResult = {
      organizationId,
      organizationName: org.name,
      sent: 0,
      skipped: 0,
      errors: [],
    };

    const origin = (process.env.WEB_ORIGIN ?? 'http://localhost:3000').split(',')[0].trim();

    for (const member of members) {
      const situation = computeQuotaSituation({
        periodicity: member.quotaPlan?.periodicity,
        joinedAt: member.joinedAt,
        lastPaidAt: member.payments[0]?.paidAt ?? null,
        cardValidUntil: member.cardValidUntil,
      });

      if (situation.status !== 'overdue') continue;

      const dedupeKey = `clubos:reminder:${organizationId}:${member.id}`;
      const already = await this.redis.get(dedupeKey);
      if (already) {
        result.skipped++;
        continue;
      }

      const email = member.email!;
      const dueLabel = situation.nextDueDate
        ? new Date(situation.nextDueDate).toLocaleDateString('pt-PT')
        : '—';

      try {
        await this.mail.send({
          to: email,
          subject: `Quota em atraso — ${org.name}`,
          text:
            `Ola ${member.name},\n\n` +
            `A sua quota em ${org.name} encontra-se em atraso.\n` +
            `Vencimento: ${dueLabel}\n\n` +
            `Por favor regularize a situacao o mais breve possivel.\n` +
            `Portal do socio: ${origin}/portal\n\n` +
            `Com os melhores cumprimentos,\n${org.name}`,
        });
        await this.redis.set(dedupeKey, '1', 'EX', REMINDER_TTL_SEC);
        result.sent++;
      } catch (e) {
        result.errors.push(`${member.name}: ${(e as Error).message}`);
      }
    }

    this.logger.log(
      `Lembretes ${org.name}: enviados=${result.sent}, ignorados=${result.skipped}, erros=${result.errors.length}`,
    );

    return result;
  }
}
