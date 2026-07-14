/**
 * @module OrganizationContextService
 * Resolve e valida a organizacao activa (tenant) por pedido HTTP.
 *
 * @see {@link OrganizationContextGuard} Aplica esta logica globalmente
 */
import { ForbiddenException, Injectable } from "@nestjs/common";
import type { Request } from "express";
import { PrismaService } from "../prisma/prisma.service";
import { resolveEffectiveRole } from "./effective-role";
import { readOrgHeader } from "./org-context";
import type { AuthUser } from "./types";

export const ACTIVE_ORG_COOKIE = "clubos_active_org";

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(
    header.split(";").map((part) => {
      const [key, ...rest] = part.trim().split("=");
      return [key, decodeURIComponent(rest.join("="))];
    }),
  );
}

@Injectable()
export class OrganizationContextService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista IDs de organizacoes onde o utilizador tem membership (staff).
   *
   * @param userId - ID do utilizador Better Auth
   * @returns IDs ordenados por data de criacao da membership
   */
  async listMembershipOrganizationIds(userId: string): Promise<string[]> {
    const rows = await this.prisma.organizationMember.findMany({
      where: { userId },
      select: { organizationId: true },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((r) => r.organizationId);
  }

  /**
   * Resolve a organizacao activa para o pedido actual.
   *
   * Prioridade: header `x-organization-id` → cookie → sessao → primeira membership.
   * Socios (`role: socio`) usam o `Member` ligado ao user.
   *
   * @param request - Pedido Express com `user` autenticado
   * @returns ID da organizacao activa validada
   * @throws {ForbiddenException} Sem auth, sem membership ou org nao autorizada
   */
  async resolveActiveOrganizationId(request: Request): Promise<string> {
    const user = request.user as AuthUser | undefined;
    if (!user?.id) {
      throw new ForbiddenException("Autenticacao em falta.");
    }

    if (user.role === "socio") {
      const member = await this.prisma.member.findFirst({
        where: { userId: user.id },
        select: { organizationId: true },
      });
      if (!member?.organizationId) {
        throw new ForbiddenException(
          "Conta de socio sem organizacao associada.",
        );
      }
      return member.organizationId;
    }

    const membershipIds = await this.listMembershipOrganizationIds(user.id);
    const headerOrgId = readOrgHeader(request.headers);
    const cookies = parseCookies(request.headers.cookie);
    const cookieOrgId = cookies[ACTIVE_ORG_COOKIE];
    const sessionOrgId = await this.readSessionActiveOrg(request);

    if (user.role === "imperador") {
      const candidate =
        headerOrgId ?? cookieOrgId ?? sessionOrgId ?? membershipIds[0];
      if (!candidate) {
        throw new ForbiddenException("Sem organizacoes disponiveis.");
      }
      const org = await this.prisma.organization.findUnique({
        where: { id: candidate },
        select: { id: true },
      });
      if (!org) {
        throw new ForbiddenException(
          "Sem permissao para aceder a esta organizacao.",
        );
      }
      return candidate;
    }

    if (membershipIds.length === 0) {
      throw new ForbiddenException("Sem organizacoes associadas a esta conta.");
    }

    const allowed = new Set(membershipIds);
    const candidate =
      headerOrgId ?? cookieOrgId ?? sessionOrgId ?? membershipIds[0];

    if (!allowed.has(candidate)) {
      throw new ForbiddenException(
        "Sem permissao para aceder a esta organizacao.",
      );
    }

    return candidate;
  }

  /** Papel efectivo na org activa (orgRole ou imperador/socio global). */
  async resolveEffectiveRole(
    user: AuthUser,
    organizationId: string,
  ): Promise<string> {
    return resolveEffectiveRole(
      this.prisma,
      user.id,
      user.role,
      organizationId,
    );
  }

  /** Verifica se o user tem membership na org (ignora socios). */
  async hasMembership(
    userId: string,
    organizationId: string,
  ): Promise<boolean> {
    const row = await this.prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
    });
    return !!row;
  }

  /** Persiste org activa na sessao Better Auth. */
  async setSessionActiveOrganization(
    sessionToken: string | undefined,
    organizationId: string,
  ): Promise<void> {
    if (!sessionToken) return;
    await this.prisma.session.updateMany({
      where: { token: sessionToken },
      data: { activeOrganizationId: organizationId },
    });
  }

  private async readSessionActiveOrg(
    request: Request,
  ): Promise<string | undefined> {
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
