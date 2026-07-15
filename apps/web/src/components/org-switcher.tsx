"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Building2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useActiveOrgId } from "@/hooks/use-active-org";
import { useMyOrganizations } from "@/hooks/use-my-organizations";
import { api } from "@/lib/api";
import { invalidateTenantQueries } from "@/lib/invalidate-tenant-queries";
import { setActiveOrganizationId } from "@/lib/org-context";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

type OrgSwitcherProps = {
  /** Versao compacta para o header mobile. */
  compact?: boolean;
};

export function OrgSwitcher({ compact = false }: OrgSwitcherProps) {
  const queryClient = useQueryClient();
  const activeOrgId = useActiveOrgId();
  const { data: orgs } = useMyOrganizations();
  const [switching, setSwitching] = useState(false);

  if (!orgs || orgs.length <= 1) return null;

  const selectValue = activeOrgId ?? orgs[0].id;

  async function switchOrg(id: string) {
    if (id === selectValue || switching) return;

    setSwitching(true);
    try {
      await api.post("/me/active-organization", { organizationId: id });
      setActiveOrganizationId(id);
      invalidateTenantQueries(queryClient);

      const name = orgs?.find((o) => o.id === id)?.name;
      toast.success(name ? `Organização: ${name}` : "Organização alterada");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Não foi possível trocar de organização.";
      toast.error(message);
    } finally {
      setSwitching(false);
    }
  }

  const selectClass = cn(
    "rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    switching && "opacity-60",
    compact ? "flex h-9 w-full min-w-0 px-2 py-1" : "flex h-9 w-full px-2 py-1",
  );

  if (compact) {
    return (
      <div className="relative min-w-0 flex-1">
        <label className="sr-only" htmlFor="org-switcher-mobile">
          Organização
        </label>
        <select
          id="org-switcher-mobile"
          value={selectValue}
          disabled={switching}
          onChange={(e) => void switchOrg(e.target.value)}
          className={selectClass}
        >
          {orgs.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        {switching && (
          <Loader2 className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>
    );
  }

  return (
    <div className="border-b p-3">
      <label
        htmlFor="org-switcher-desktop"
        className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
      >
        <Building2 className="h-3.5 w-3.5" />
        Organização
        {switching && <Loader2 className="h-3 w-3 animate-spin" aria-hidden />}
      </label>

      <select
        id="org-switcher-desktop"
        value={selectValue}
        disabled={switching}
        onChange={(e) => void switchOrg(e.target.value)}
        className={selectClass}
      >
        {orgs.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </div>
  );
}
