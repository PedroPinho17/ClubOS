/**
 * Contratos partilhados API ↔ Web (roles, paginação).
 * Evita drift entre `apps/api` e `apps/web`.
 */

/** Staff do backoffice (exclui socio do portal). */
export const STAFF_ROLES = [
  "imperador",
  "administrador",
  "tesoureiro",
] as const;

/** Administração da organização. */
export const ADMIN_ROLES = ["imperador", "administrador"] as const;

/** Portal do sócio. */
export const PORTAL_ROLES = ["socio"] as const;

/** Super-admin da plataforma. */
export const IMPERADOR_ROLES = ["imperador"] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];
export type AdminRole = (typeof ADMIN_ROLES)[number];
export type PortalRole = (typeof PORTAL_ROLES)[number];
export type PlatformRole = StaffRole | PortalRole;

export function isStaffRole(
  role: string | null | undefined,
): role is StaffRole {
  return role != null && (STAFF_ROLES as readonly string[]).includes(role);
}

export function isAdminRole(
  role: string | null | undefined,
): role is AdminRole {
  return role != null && (ADMIN_ROLES as readonly string[]).includes(role);
}

export function isImperadorRole(role: string | null | undefined): boolean {
  return role === "imperador";
}

export function isPortalRole(
  role: string | null | undefined,
): role is PortalRole {
  return role != null && (PORTAL_ROLES as readonly string[]).includes(role);
}

/** Resposta paginada standard da API. */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
