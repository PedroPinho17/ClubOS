import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { StorageService } from "../../storage/storage.service";
import { OrganizationContextService } from "../../common/organization-context.service";
import type { AuthUser } from "../../common/types";

@Injectable()
export class MeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly orgContext: OrganizationContextService,
  ) {}

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
  ) {
    if (user.role === "socio") {
      const member = await this.prisma.member.findFirst({
        where: { userId: user.id },
      });
      if (member?.organizationId !== organizationId) {
        throw new ForbiddenException(
          "Sem permissao para aceder a esta organizacao.",
        );
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
}
