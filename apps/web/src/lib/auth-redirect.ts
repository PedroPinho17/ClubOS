/** Destino apos login consoante o role do utilizador. */
export function postLoginPath(role: string | null | undefined): string {
  return role === 'socio' ? '/portal' : '/dashboard';
}

/** Roles com acesso ao backoffice administrativo. */
export function isAdminRole(role: string | null | undefined): boolean {
  return role === 'imperador' || role === 'administrador' || role === 'tesoureiro';
}
