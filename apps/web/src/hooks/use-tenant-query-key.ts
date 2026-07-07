'use client';

import { useActiveOrgId } from './use-active-org';

/** Inclui o tenant ativo na queryKey para nao misturar cache entre organizacoes. */
export function useTenantQueryKey<T extends readonly unknown[]>(base: T): [...T, string | null] {
  const orgId = useActiveOrgId();
  return [...base, orgId];
}
