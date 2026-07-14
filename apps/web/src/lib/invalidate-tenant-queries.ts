import type { QueryClient } from "@tanstack/react-query";

const TENANT_QUERY_ROOTS = [
  "organization",
  "modules",
  "members",
  "membership-plans",
  "payments",
  "reports",
  "communications",
  "card",
  "card-settings",
  "users",
] as const;

/** Limpa cache tenant-scoped apos troca de organizacao activa. */
export function invalidateTenantQueries(queryClient: QueryClient) {
  for (const root of TENANT_QUERY_ROOTS) {
    void queryClient.invalidateQueries({ queryKey: [root] });
  }
  void queryClient.invalidateQueries({ queryKey: ["me", "context"] });
}
