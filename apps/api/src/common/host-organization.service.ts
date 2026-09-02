import { Injectable } from "@nestjs/common";
import type { Request } from "express";
import { PrismaService } from "../prisma/prisma.service";
import {
  hostnameLookupCandidates,
  isPlatformHost,
  parseRequestHost,
} from "./host-hostname";

export type HostOrgResolution = {
  organizationId: string;
  domain: string;
};

const HOST_ORG_SELECT = {
  id: true,
  name: true,
  domain: true,
  primaryColor: true,
  logoKey: true,
} as const;

@Injectable()
export class HostOrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveFromRequest(
    request: Request,
  ): Promise<HostOrgResolution | null> {
    const host = parseRequestHost(
      request.headers as Record<string, string | string[] | undefined>,
    );
    if (!host || isPlatformHost(host)) return null;

    const org = await this.findByHostname(host);
    if (!org?.domain) return null;
    return { organizationId: org.id, domain: org.domain };
  }

  async findByHostname(host: string) {
    const candidates = hostnameLookupCandidates(host);
    if (candidates.length === 0) return null;

    return this.prisma.organization.findFirst({
      where: { domain: { in: candidates } },
      select: HOST_ORG_SELECT,
    });
  }
}
