import {
  ADMIN_ROLES,
  isAdminRole,
  isImperadorRole,
  isStaffRole,
} from "@clubos/shared";

/** Permissões do backoffice com base no papel efectivo por organização. */

export function canManageMembers(role: string | null | undefined): boolean {
  return isAdminRole(role);
}

export function canExportReports(role: string | null | undefined): boolean {
  return isStaffRole(role);
}

export function canAccessCards(role: string | null | undefined): boolean {
  return isAdminRole(role);
}

export function isImperador(role: string | null | undefined): boolean {
  return isImperadorRole(role);
}

export function canInviteAdmin(role: string | null | undefined): boolean {
  return isImperadorRole(role);
}

export { ADMIN_ROLES };
