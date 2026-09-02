import { Controller, Get, Req } from "@nestjs/common";
import { AllowAnonymous } from "@thallesp/nestjs-better-auth";
import type { Request } from "express";
import { NoOrgContext } from "../../common/decorators";
import {
  hostnameAliases,
  isPlatformHost,
  normalizeHostname,
  parseRequestHost,
} from "../../common/host-hostname";
import { HostOrganizationService } from "../../common/host-organization.service";
import { StorageService } from "../../storage/storage.service";

function passkeysEnabledForHost(host: string | null): boolean {
  const rp = normalizeHostname(process.env.PASSKEY_RP_ID ?? "localhost");
  if (!host) return rp === "localhost";
  return host === rp || hostnameAliases(host).includes(rp);
}

export type HostOrgResponse =
  | { kind: "platform"; passkeysEnabled: boolean }
  | {
      kind: "org";
      id: string;
      name: string;
      primaryColor: string;
      logoUrl: string | null;
      passkeysEnabled: boolean;
    };

@Controller("api/public")
@NoOrgContext()
export class HostOrgController {
  constructor(
    private readonly hostOrgs: HostOrganizationService,
    private readonly storage: StorageService,
  ) {}

  @Get("host-org")
  @AllowAnonymous()
  async hostOrg(@Req() req: Request): Promise<HostOrgResponse> {
    const host = parseRequestHost(
      req.headers as Record<string, string | string[] | undefined>,
    );
    const passkeysEnabled = passkeysEnabledForHost(host);
    const org =
      host && !isPlatformHost(host)
        ? await this.hostOrgs.findByHostname(host)
        : null;
    if (!org) {
      return { kind: "platform", passkeysEnabled };
    }

    return {
      kind: "org",
      id: org.id,
      name: org.name,
      primaryColor: org.primaryColor,
      logoUrl: await this.storage.getUrl(org.logoKey),
      passkeysEnabled,
    };
  }
}
