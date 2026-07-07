'use client';

import { useEffect } from 'react';
import { applyOrgDocumentBranding, resetOrgDocumentBranding } from '@/lib/org-document';

interface OrgDocumentBrandingProps {
  name?: string | null;
  logoUrl?: string | null;
  organizationId?: string | null;
}

/** Sincroniza titulo do separador e favicon com a organizacao ativa. */
export function OrgDocumentBranding({ name, logoUrl, organizationId }: OrgDocumentBrandingProps) {
  useEffect(() => {
    if (name || logoUrl) {
      applyOrgDocumentBranding(name, logoUrl, organizationId);
    } else {
      resetOrgDocumentBranding();
    }
  }, [name, logoUrl, organizationId]);

  return null;
}
