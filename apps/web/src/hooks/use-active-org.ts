'use client';

import { useEffect, useState } from 'react';
import { getActiveOrganizationId, ORG_CHANGED_EVENT } from '@/lib/org-context';

/** ID da organizacao ativa (Imperador). Atualiza quando o switcher muda. */
export function useActiveOrgId(): string | null {
  const [orgId, setOrgId] = useState<string | null>(() =>
    typeof window !== 'undefined' ? getActiveOrganizationId() : null,
  );

  useEffect(() => {
    const sync = () => setOrgId(getActiveOrganizationId());
    sync();

    const onChange = () => sync();
    window.addEventListener(ORG_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(ORG_CHANGED_EVENT, onChange);
  }, []);

  return orgId;
}
