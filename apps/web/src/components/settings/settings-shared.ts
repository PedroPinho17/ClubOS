export const ROLE_LABEL: Record<string, string> = {
  imperador: "Imperador",
  administrador: "Administrador",
  tesoureiro: "Tesoureiro",
};

export const ROLE_BADGE: Record<string, "default" | "secondary" | "success"> = {
  imperador: "default",
  administrador: "success",
  tesoureiro: "secondary",
};

export const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
