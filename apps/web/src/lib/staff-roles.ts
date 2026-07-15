/** Roles com acesso ao backoffice (staff). */
export const STAFF_ROLES = [
  "imperador",
  "administrador",
  "tesoureiro",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export function isStaffRole(
  role: string | null | undefined,
): role is StaffRole {
  return role != null && (STAFF_ROLES as readonly string[]).includes(role);
}

/** @deprecated Preferir isStaffRole — alias para compatibilidade. */
export const isAdminRole = isStaffRole;
