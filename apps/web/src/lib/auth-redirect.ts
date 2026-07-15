import { isStaffRole } from "@/lib/staff-roles";

/** Destino após login consoante o role e flags do utilizador. */
export function postLoginPath(
  role: string | null | undefined,
  mustChangePassword?: boolean | null,
): string {
  if (mustChangePassword) return "/change-password";
  return role === "socio" ? "/portal" : "/dashboard";
}

export function redirectSocioFromAdmin(role: string): string | null {
  return role === "socio" ? "/portal" : null;
}

export function redirectAdminFromPortal(role: string): string | null {
  return isStaffRole(role) ? "/dashboard" : null;
}

export function sessionMustChangePassword(user: {
  mustChangePassword?: boolean | null;
}): boolean {
  return user.mustChangePassword === true;
}
