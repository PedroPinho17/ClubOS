"use client";

import { useEffect, useState } from "react";
import { apiBaseUrl } from "@/lib/api-base-url";

/** null = a verificar; true/false = resultado do ping a /api/health */
export function useApiHealth() {
  const [reachable, setReachable] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch(`${apiBaseUrl()}/api/health`, {
          cache: "no-store",
          signal: AbortSignal.timeout(4_000),
        });
        if (!cancelled) setReachable(res.ok);
      } catch {
        if (!cancelled) setReachable(false);
      }
    }

    void check();
    const id = window.setInterval(check, 15_000);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return reachable;
}
