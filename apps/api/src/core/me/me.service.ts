import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Request } from "express";
import { PrismaService } from "../../prisma/prisma.service";
import { StorageService } from "../../storage/storage.service";
import { HOST_ORG_MISMATCH_MESSAGE } from "../../common/host-hostname";
import { HostOrganizationService } from "../../common/host-organization.service";
import { OrganizationContextService } from "../../common/organization-context.service";
import type { AuthUser } from "../../common/types";

@Injectable()
export class MeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly orgContext: OrganizationContextService,
    private readonly hostOrgs: HostOrganizationService,
  ) {}

  /** Contexto activo: org resolvida + papel efectivo (para o frontend). */
  async getActiveContext(user: AuthUser, request: Request) {
    const hostOrg = await this.hostOrgs.resolveFromRequest(request);
    const organizationId =
      await this.orgContext.resolveActiveOrganizationId(request);
    const effectiveRole = await this.orgContext.resolveEffectiveRole(
      user,
      organizationId,
    );
    return {
      organizationId,
      effectiveRole,
      hostLocked: !!hostOrg,
      hostOrganizationId: hostOrg?.organizationId ?? null,
    };
  }

  async listOrganizations(user: AuthUser) {
    if (user.role === "socio") {
      const member = await this.prisma.member.findFirst({
        where: { userId: user.id },
        include: { organization: true },
      });
      if (!member) return [];
      const org = member.organization;
      return [
        {
          id: org.id,
          name: org.name,
          slug: org.slug,
          plan: org.plan,
          status: org.status,
          primaryColor: org.primaryColor,
          logoUrl: await this.storage.getUrl(org.logoKey),
          orgRole: "socio",
        },
      ];
    }

    const memberships = await this.prisma.organizationMember.findMany({
      where: { userId: user.id },
      include: { organization: true },
      orderBy: { createdAt: "asc" },
    });

    return Promise.all(
      memberships.map(async (m) => ({
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        plan: m.organization.plan,
        status: m.organization.status,
        primaryColor: m.organization.primaryColor,
        logoUrl: await this.storage.getUrl(m.organization.logoKey),
        orgRole: user.role === "imperador" ? "imperador" : m.orgRole,
      })),
    );
  }

  async setActiveOrganization(
    user: AuthUser,
    organizationId: string,
    sessionToken?: string,
    request?: Request,
  ) {
    if (request) {
      const hostOrg = await this.hostOrgs.resolveFromRequest(request);
      if (
        hostOrg &&
        user.role !== "imperador" &&
        organizationId !== hostOrg.organizationId
      ) {
        throw new ForbiddenException(HOST_ORG_MISMATCH_MESSAGE);
      }
    }

    if (user.role === "socio") {
      const member = await this.prisma.member.findFirst({
        where: { userId: user.id },
      });
      if (member?.organizationId !== organizationId) {
        throw new ForbiddenException(
          "Sem permissao para aceder a esta organizacao.",
        );
      }
    } else if (user.role === "imperador") {
      const org = await this.prisma.organization.findUnique({
        where: { id: organizationId },
      });
      if (!org) {
        throw new NotFoundException("Organizacao nao encontrada.");
      }
    } else {
      const ok = await this.orgContext.hasMembership(user.id, organizationId);
      if (!ok) {
        throw new ForbiddenException(
          "Sem permissao para aceder a esta organizacao.",
        );
      }
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) {
      throw new NotFoundException("Organizacao nao encontrada.");
    }

    await this.orgContext.setSessionActiveOrganization(
      sessionToken,
      organizationId,
    );
    return { organizationId, name: org.name };
  }

  /** Limpa o flag apos o utilizador alterar a password no primeiro login. */
  async completePasswordChange(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("Utilizador nao encontrado.");
    if (!user.mustChangePassword) {
      return { mustChangePassword: false };
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { mustChangePassword: false },
    });
    return { mustChangePassword: false };
  }

  /**
   * Pedido de eliminacao de conta (App Store / Play).
   * Cria registo PENDING; a anonimizacao fica a cargo do admin (MemberGdprService).
   */
  async requestAccountDeletion(userId: string, reason?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("Utilizador nao encontrado.");

    const member = await this.prisma.member.findFirst({
      where: { userId },
      select: { organizationId: true },
    });

    const existing = await this.prisma.accountDeletionRequest.findFirst({
      where: { userId, status: "PENDING" },
    });
    if (existing) {
      return {
        id: existing.id,
        status: existing.status,
        createdAt: existing.createdAt.toISOString(),
        message: "Ja existe um pedido pendente.",
      };
    }

    const req = await this.prisma.accountDeletionRequest.create({
      data: {
        userId,
        organizationId: member?.organizationId,
        reason: reason?.trim() || null,
      },
    });

    return {
      id: req.id,
      status: req.status,
      createdAt: req.createdAt.toISOString(),
      message:
        "Pedido registado. A associacao ira processar a eliminacao dos seus dados.",
    };
  }
}
