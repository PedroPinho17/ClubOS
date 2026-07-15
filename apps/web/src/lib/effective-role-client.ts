import type { MyOrganization } from "@/lib/types";

/** Resolve papel efectivo no cliente (alinhado com resolveEffectiveRole da API). */
export function resolveClientEffectiveRole(
  globalRole: string | null | undefined,
  activeOrgId: string | null,
  orgs: MyOrganization[] | undefined,
): string | null {
  if (!activeOrgId) return null;
  if (globalRole === "socio") return "socio";
  if (globalRole === "imperador") return "imperador";
  return orgs?.find((o) => o.id === activeOrgId)?.orgRole ?? null;
}
