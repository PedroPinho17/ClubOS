/** Etiquetas PT para roles da plataforma. */
export const ROLE_LABEL: Record<string, string> = {
  imperador: "Imperador",
  administrador: "Administrador",
  tesoureiro: "Tesoureiro",
  socio: "Sócio",
};

export function roleLabel(role: string | null | undefined): string {
  if (!role) return "Utilizador";
  return ROLE_LABEL[role] ?? role;
}
