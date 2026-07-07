const STORAGE_KEY = 'clubos:active-organization-id';
export const ORG_CHANGED_EVENT = 'clubos:org-changed';

export function getActiveOrganizationId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function setActiveOrganizationId(id: string): void {
  localStorage.setItem(STORAGE_KEY, id);
  window.dispatchEvent(new CustomEvent(ORG_CHANGED_EVENT, { detail: id }));
}

export function orgRequestHeaders(): HeadersInit {
  const orgId = getActiveOrganizationId();
  return orgId ? { 'x-organization-id': orgId } : {};
}
