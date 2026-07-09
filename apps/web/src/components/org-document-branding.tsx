"use client";

import { useEffect } from "react";
import {
  applyOrgDocumentBranding,
  resetOrgDocumentBranding,
} from "@/lib/org-document";

interface OrgDocumentBrandingProps {
  name?: string | null;
  logoUrl?: string | null;
  logoApiPath?: string | null;
  organizationId?: string | null;
}

/** Sincroniza titulo do separador e favicon com a organizacao ativa. */
export function OrgDocumentBranding({
  name,
  logoUrl,
  logoApiPath,
  organizationId,
}: OrgDocumentBrandingProps) {
  useEffect(() => {
    if (name || logoUrl || logoApiPath) {
      applyOrgDocumentBranding(name, logoUrl, organizationId, logoApiPath);
    } else {
      resetOrgDocumentBranding();
    }
  }, [name, logoUrl, logoApiPath, organizationId]);

  return null;
}
