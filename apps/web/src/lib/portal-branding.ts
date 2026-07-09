import type { PortalMe } from "@/lib/types";

export const PORTAL_LOGO_PATH = "/portal/organization/logo";
export const PORTAL_ME_QUERY_KEY = ["portal", "me", "v2"] as const;

export interface PortalBranding {
  id: string | null;
  name: string | null;
  primaryColor: string | null;
  hasLogo: boolean;
  logoApiPath: string | null;
  logoUrl: string | null;
}

/** Enriquece cache antigo (sem `organization`) com dados do cartao. */
export function enrichPortalMeCache(
  cached: PortalMe | null,
): PortalMe | undefined {
  if (!cached) return undefined;
  if (cached.organization?.name) return cached;

  const cardOrg = cached.card?.organization;
  if (!cardOrg?.name) return cached;

  return {
    ...cached,
    organization: {
      id: cached.organization?.id ?? "",
      name: cardOrg.name,
      primaryColor:
        cardOrg.primaryColor ?? cached.organization?.primaryColor ?? "",
      hasLogo: cached.organization?.hasLogo ?? !!cardOrg.logoUrl,
    },
  };
}

/** Resolve branding da org para o header do portal (multiplas fontes). */
export function resolvePortalBranding(me?: PortalMe | null): PortalBranding {
  const org = me?.organization;
  const cardOrg = me?.card?.organization;
  const name = org?.name ?? cardOrg?.name ?? null;
  const hasLogo = org?.hasLogo ?? !!cardOrg?.logoUrl;

  return {
    id: org?.id ?? null,
    name,
    primaryColor: org?.primaryColor ?? cardOrg?.primaryColor ?? null,
    hasLogo,
    logoApiPath: hasLogo ? PORTAL_LOGO_PATH : null,
    logoUrl: cardOrg?.logoUrl ?? null,
  };
}
