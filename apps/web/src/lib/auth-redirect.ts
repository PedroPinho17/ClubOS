/** Destino após login consoante o role e flags do utilizador. */
export function postLoginPath(
  role: string | null | undefined,
  mustChangePassword?: boolean | null,
): string {
  if (mustChangePassword) return "/change-password";
  return role === "socio" ? "/portal" : "/dashboard";
}

/** Roles com acesso ao backoffice administrativo. */
export function isAdminRole(role: string | null | undefined): boolean {
  return (
    role === "imperador" || role === "administrador" || role === "tesoureiro"
  );
}

export function redirectSocioFromAdmin(role: string): string | null {
  return role === "socio" ? "/portal" : null;
}

export function redirectAdminFromPortal(role: string): string | null {
  return isAdminRole(role) ? "/dashboard" : null;
}

export function sessionMustChangePassword(user: {
  mustChangePassword?: boolean | null;
}): boolean {
  return user.mustChangePassword === true;
}
