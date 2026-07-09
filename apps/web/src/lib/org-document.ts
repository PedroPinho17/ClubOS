import { getActiveOrganizationId } from "./org-context";

const DEFAULT_TITLE = "ClubOS";
const DEFAULT_FAVICON = "/clubos-icon.svg";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const FAVICON_LINK_ID = "clubos-org-favicon";

let faviconBlobUrl: string | null = null;

/** Atualiza favicon sem remover links geridos pelo Next (evita crash removeChild no React). */
function setFaviconHref(href: string): void {
  let link = document.getElementById(FAVICON_LINK_ID) as HTMLLinkElement | null;

  if (!link) {
    const existing = document.querySelector(
      'link[rel="icon"]',
    ) as HTMLLinkElement | null;
    if (existing) {
      link = existing;
      link.id = FAVICON_LINK_ID;
    } else {
      link = document.createElement("link");
      link.id = FAVICON_LINK_ID;
      link.rel = "icon";
      document.head.appendChild(link);
    }
  }

  if (link.href !== new URL(href, window.location.origin).href) {
    link.href = href;
  }
}

function revokeFaviconBlob(): void {
  if (faviconBlobUrl) {
    URL.revokeObjectURL(faviconBlobUrl);
    faviconBlobUrl = null;
  }
}

async function applyFavicon(
  organizationId?: string | null,
  opts?: { hasLogo?: boolean; logoApiPath?: string | null },
): Promise<void> {
  revokeFaviconBlob();

  if (!opts?.hasLogo) {
    setFaviconHref(DEFAULT_FAVICON);
    return;
  }

  const logoPath = opts.logoApiPath ?? "/organization/logo";
  const headers: HeadersInit = {};
  const orgId = organizationId ?? getActiveOrganizationId();
  if (orgId && !opts.logoApiPath) headers["x-organization-id"] = orgId;

  try {
    const res = await fetch(`${API_URL}/api${logoPath}`, {
      credentials: "include",
      headers,
    });
    if (!res.ok) throw new Error("Falha ao obter logotipo.");
    const blob = await res.blob();
    faviconBlobUrl = URL.createObjectURL(blob);
    setFaviconHref(faviconBlobUrl);
  } catch {
    setFaviconHref(DEFAULT_FAVICON);
  }
}

/** Atualiza o titulo do separador e o favicon com branding da organizacao. */
export function applyOrgDocumentBranding(
  name?: string | null,
  logoUrl?: string | null,
  organizationId?: string | null,
  logoApiPath?: string | null,
): void {
  document.title = name?.trim() || DEFAULT_TITLE;
  void applyFavicon(organizationId, {
    hasLogo: !!logoUrl?.trim() || !!logoApiPath,
    logoApiPath,
  });
}

/** Repoe o branding generico da plataforma (login, paginas publicas). */
export function resetOrgDocumentBranding(): void {
  document.title = DEFAULT_TITLE;
  revokeFaviconBlob();
  setFaviconHref(DEFAULT_FAVICON);
}
