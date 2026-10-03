"use client";

import { useEffect, useState } from "react";
import { apiBaseUrl } from "@/lib/api-base-url";

/** Carrega logotipo via API autenticada (cookies) — necessário no portal cross-origin. */
export function useOrgLogoBlob(logoApiPath?: string | null) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!logoApiPath) return;

    let cancelled = false;
    let objectUrl: string | null = null;

    void (async () => {
      try {
        const res = await fetch(`${apiBaseUrl()}/api${logoApiPath}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("logo unavailable");
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) setBlobUrl(objectUrl);
      } catch {
        if (!cancelled) setBlobUrl(null);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [logoApiPath]);

  return logoApiPath ? blobUrl : null;
}
