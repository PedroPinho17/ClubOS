import { randomBytes } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentStatus } from '@clubos/database';
import { auth } from '../../auth/auth';
import { MailService } from '../../core/mail/mail.service';
import { portalAccessEmail } from '../../core/mail/templates/portal-access';
import { PrismaService } from '../../prisma/prisma.service';
import { CardsService } from '../cards/cards.service';
import { PaymentsService } from '../payments/payments.service';
import { computeQuotaSituation } from '../members/quota.util';
import { loadOrgReminderSettings } from '../reminders/org-reminder-settings';

@Injectable()
export class PortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cards: CardsService,
    private readonly mail: MailService,
    private readonly payments: PaymentsService,
  ) {}

  async getMe(userId: string) {
    const member = await this.prisma.member.findFirst({
      where: { userId },
      include: {
        quotaPlan: true,
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!member) {
      throw new NotFoundException('A sua conta ainda nao esta associada a um socio.');
    }

    const lastPaid = member.payments.find((p) => p.status === PaymentStatus.PAID && p.paidAt);
    const { diasAvisoQuota } = await loadOrgReminderSettings(this.prisma, member.organizationId);
    const quotaSituation = computeQuotaSituation({
      periodicity: member.quotaPlan?.periodicity,
      joinedAt: member.joinedAt,
      lastPaidAt: lastPaid?.paidAt ?? null,
      cardValidUntil: member.cardValidUntil,
      dueSoonDays: diasAvisoQuota,
    });

    let card: Awaited<ReturnType<CardsService['getCardData']>> | null = null;
    try {
      card = await this.cards.getCardData(member.organizationId, member.id);
    } catch {
      // modulo cards pode estar inativo
    }

    return {
      member: {
        id: member.id,
        number: member.number,
        name: member.name,
        email: member.email,
        phone: member.phone,
        status: member.status,
        joinedAt: member.joinedAt.toISOString(),
        planName: member.quotaPlan?.name ?? null,
      },
      quotaSituation,
      payments: member.payments.map((p) => ({
        id: p.id,
        amount: Number(p.amount).toFixed(2),
        method: p.method,
        status: p.status,
        paidAt: p.paidAt?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
      })),
      card,
    };
  }

  /** Cria conta de acesso ao portal e envia credenciais temporarias por email. */
  async grantAccess(organizationId: string, memberId: string) {
    const member = await this.prisma.member.findFirst({ where: { id: memberId, organizationId } });
    if (!member) throw new NotFoundException('Socio nao encontrado.');
    if (!member.email) throw new BadRequestException('O socio nao tem email definido.');
    if (member.userId) throw new BadRequestException('Este socio ja tem acesso ao portal.');

    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true, primaryColor: true },
    });
    if (!org) throw new NotFoundException('Organizacao nao encontrada.');

    const tempPassword = `Cv${randomBytes(6).toString('base64url')}!9`;

    let user = await this.prisma.user.findUnique({ where: { email: member.email } });
    if (!user) {
      await auth.api.signUpEmail({
        body: { email: member.email, password: tempPassword, name: member.name },
      });
      user = await this.prisma.user.findUnique({ where: { email: member.email } });
    }
    if (!user) throw new BadRequestException('Nao foi possivel criar a conta de acesso.');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { role: 'socio', emailVerified: true },
    });
    await this.prisma.member.update({ where: { id: member.id }, data: { userId: user.id } });

    const origin = (process.env.WEB_ORIGIN ?? 'http://localhost:3000').split(',')[0].trim();
    const rendered = portalAccessEmail({
      branding: { name: org.name, primaryColor: org.primaryColor },
      memberName: member.name,
      email: member.email,
      tempPassword,
      loginUrl: `${origin}/login`,
    });
    await this.mail.send({
      to: member.email,
      subject: 'Acesso ao Portal do Sócio',
      text: rendered.text,
      html: rendered.html,
    });

    return { email: member.email, tempPassword };
  }

  /** Recibo PDF de um pagamento do socio autenticado. */
  async getReceipt(userId: string, paymentId: string) {
    const member = await this.prisma.member.findFirst({ where: { userId } });
    if (!member) {
      throw new NotFoundException('A sua conta ainda nao esta associada a um socio.');
    }

    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, memberId: member.id, organizationId: member.organizationId },
    });
    if (!payment) {
      throw new NotFoundException('Pagamento nao encontrado.');
    }
    if (payment.status !== PaymentStatus.PAID) {
      throw new BadRequestException('Recibo disponivel apenas para pagamentos concluidos.');
    }

    return this.payments.getReceipt(member.organizationId, paymentId);
  }
}
