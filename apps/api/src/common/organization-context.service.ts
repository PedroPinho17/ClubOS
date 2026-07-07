import { ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { readOrgHeader } from './org-context';
import type { AuthUser } from './types';

export const ACTIVE_ORG_COOKIE = 'clubos_active_org';

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(
    header.split(';').map((part) => {
      const [key, ...rest] = part.trim().split('=');
      return [key, decodeURIComponent(rest.join('='))];
    }),
  );
}

@Injectable()
export class OrganizationContextService {
  constructor(private readonly prisma: PrismaService) {}

  /** Lista memberships do utilizador (staff/imperador). Socios usam Member. */
  async listMembershipOrganizationIds(userId: string): Promise<string[]> {
    const rows = await this.prisma.organizationMember.findMany({
      where: { userId },
      select: { organizationId: true },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => r.organizationId);
  }

  /** Resolve org activa validando membership (ou Member para socios). */
  async resolveActiveOrganizationId(request: Request): Promise<string> {
    const user = request.user as AuthUser | undefined;
    if (!user?.id) {
      throw new ForbiddenException('Autenticacao em falta.');
    }

    if (user.role === 'socio') {
      const member = await this.prisma.member.findFirst({
        where: { userId: user.id },
        select: { organizationId: true },
      });
      if (!member?.organizationId) {
        throw new ForbiddenException('Conta de socio sem organizacao associada.');
      }
      return member.organizationId;
    }

    const membershipIds = await this.listMembershipOrganizationIds(user.id);

    // Fallback legacy durante migracao.
    if (membershipIds.length === 0 && user.organizationId) {
      membershipIds.push(user.organizationId);
    }

    if (membershipIds.length === 0) {
      throw new ForbiddenException('Sem organizacoes associadas a esta conta.');
    }

    const allowed = new Set(membershipIds);
    const headerOrgId = readOrgHeader(request.headers);
    const cookies = parseCookies(request.headers.cookie);
    const cookieOrgId = cookies[ACTIVE_ORG_COOKIE];
    const sessionOrgId = await this.readSessionActiveOrg(request);

    const candidate = headerOrgId ?? cookieOrgId ?? sessionOrgId ?? membershipIds[0];

    if (!allowed.has(candidate)) {
      throw new ForbiddenException('Sem permissao para aceder a esta organizacao.');
    }

    return candidate;
  }

  /** Verifica se o user tem membership na org (ignora socios). */
  async hasMembership(userId: string, organizationId: string): Promise<boolean> {
    const row = await this.prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
    });
    return !!row;
  }

  /** Persiste org activa na sessao Better Auth. */
  async setSessionActiveOrganization(sessionToken: string | undefined, organizationId: string): Promise<void> {
    if (!sessionToken) return;
    await this.prisma.session.updateMany({
      where: { token: sessionToken },
      data: { activeOrganizationId: organizationId },
    });
  }

  private async readSessionActiveOrg(request: Request): Promise<string | undefined> {
    const session = request.session as { token?: string } | undefined;
    const token = session?.token;
    if (!token) return undefined;

    const row = await this.prisma.session.findUnique({
      where: { token },
      select: { activeOrganizationId: true },
    });
    return row?.activeOrganizationId ?? undefined;
  }
}
