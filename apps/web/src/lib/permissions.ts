/** Permissoes do backoffice com base no papel efectivo por organizacao. */

export function canManageMembers(role: string | null | undefined): boolean {
  return role === "imperador" || role === "administrador";
}

export function canExportReports(role: string | null | undefined): boolean {
  return (
    role === "imperador" || role === "administrador" || role === "tesoureiro"
  );
}

export function canAccessCards(role: string | null | undefined): boolean {
  return role === "imperador" || role === "administrador";
}

export function isImperador(role: string | null | undefined): boolean {
  return role === "imperador";
}

export function canInviteAdmin(role: string | null | undefined): boolean {
  return role === "imperador";
}
