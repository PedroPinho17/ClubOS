import { randomBytes } from 'node:crypto';
import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { auth } from '../../auth/auth';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { InvitableRole } from './dto';

const STAFF_ORG_ROLES = ['administrador', 'tesoureiro'] as const;

const ROLE_LABEL: Record<string, string> = {
  imperador: 'Imperador',
  administrador: 'Administrador',
  tesoureiro: 'Tesoureiro',
};

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly audit: AuditService,
  ) {}

  async listStaff(organizationId: string) {
    const memberships = await this.prisma.organizationMember.findMany({
      where: {
        organizationId,
        orgRole: { in: ['imperador', 'administrador', 'tesoureiro'] },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            emailVerified: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (memberships.length === 0) {
      return [];
    }

    return memberships.map((m) => ({
      ...m.user,
      role: m.user.role === 'imperador' ? 'imperador' : m.orgRole,
    }));
  }

  async invite(organizationId: string, actorRole: string | null | undefined, actorId: string, dto: {
    name: string;
    email: string;
    role: InvitableRole;
  }) {
    if (actorRole === 'administrador' && dto.role !== 'tesoureiro') {
      throw new ForbiddenException('Administradores so podem convidar tesoureiros.');
    }
    if (actorRole !== 'imperador' && actorRole !== 'administrador') {
      throw new ForbiddenException('Sem permissao para convidar utilizadores.');
    }

    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { email },
      include: { member: true, organizationMemberships: true },
    });

    if (existing?.role === 'socio' && existing.member) {
      throw new BadRequestException('Este email esta associado a um socio. Use o portal do socio.');
    }

    const alreadyInOrg = existing?.organizationMemberships.some((m) => m.organizationId === organizationId);
    if (alreadyInOrg) {
      throw new BadRequestException('Este utilizador ja pertence a esta organizacao.');
    }

    const otherOrgMembership = existing?.organizationMemberships.find((m) => m.organizationId !== organizationId);
    if (otherOrgMembership && actorRole !== 'imperador') {
      throw new BadRequestException('Este email ja pertence a outra organizacao.');
    }

    const tempPassword = `Cv${randomBytes(6).toString('base64url')}!9`;

    if (!existing) {
      await auth.api.signUpEmail({
        body: { email, password: tempPassword, name: dto.name },
      });
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException('Nao foi possivel criar a conta.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        name: dto.name,
        role: dto.role,
        emailVerified: true,
      },
    });

    await this.prisma.organizationMember.upsert({
      where: { userId_organizationId: { userId: user.id, organizationId } },
      update: { orgRole: dto.role },
      create: { userId: user.id, organizationId, orgRole: dto.role },
    });

    const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
    const origin = (process.env.WEB_ORIGIN ?? 'http://localhost:3000').split(',')[0].trim();
    const roleLabel = ROLE_LABEL[dto.role] ?? dto.role;

    await this.mail.send({
      to: email,
      subject: `Convite ClubOS — ${org?.name ?? 'Organizacao'}`,
      text:
        `Ola ${dto.name},\n\n` +
        `Foi convidado(a) para a equipa de ${org?.name ?? 'organizacao'} no ClubOS.\n\n` +
        `Funcao: ${roleLabel}\n` +
        `Email: ${email}\n` +
        `${existing ? 'Use a sua password atual para entrar.' : `Password temporaria: ${tempPassword}`}\n\n` +
        `Aceda em: ${origin}/login\n\n` +
        `Recomendamos que altere a password apos o primeiro acesso.`,
    });

    await this.audit.log({
      organizationId,
      userId: actorId,
      action: 'user.invited',
      entity: 'User',
      entityId: user.id,
      meta: { email, role: dto.role },
    });

    return {
      id: user.id,
      email,
      name: dto.name,
      role: dto.role,
      tempPassword: existing ? null : tempPassword,
    };
  }
}
