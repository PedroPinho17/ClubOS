import { getActiveOrganizationId } from './org-context';

const DEFAULT_TITLE = 'ClubOS';
const DEFAULT_FAVICON = '/clubos-icon.svg';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

let faviconBlobUrl: string | null = null;

/** Substitui todos os favicons do documento (inclui os injetados pelo Next.js). */
function setFaviconHref(href: string): void {
  document.querySelectorAll("link[rel*='icon']").forEach((el) => el.remove());
  const link = document.createElement('link');
  link.rel = 'icon';
  link.href = href;
  document.head.appendChild(link);
}

function revokeFaviconBlob(): void {
  if (faviconBlobUrl) {
    URL.revokeObjectURL(faviconBlobUrl);
    faviconBlobUrl = null;
  }
}

async function applyFavicon(organizationId?: string | null, hasLogo?: boolean): Promise<void> {
  revokeFaviconBlob();

  if (!hasLogo) {
    setFaviconHref(DEFAULT_FAVICON);
    return;
  }

  const headers: HeadersInit = {};
  const orgId = organizationId ?? getActiveOrganizationId();
  if (orgId) headers['x-organization-id'] = orgId;

  try {
    const res = await fetch(`${API_URL}/api/organization/logo`, {
      credentials: 'include',
      headers,
    });
    if (!res.ok) throw new Error('Falha ao obter logotipo.');
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
): void {
  document.title = name?.trim() || DEFAULT_TITLE;
  void applyFavicon(organizationId, !!logoUrl?.trim());
}

/** Repoe o branding generico da plataforma (login, paginas publicas). */
export function resetOrgDocumentBranding(): void {
  document.title = DEFAULT_TITLE;
  revokeFaviconBlob();
  setFaviconHref(DEFAULT_FAVICON);
}
