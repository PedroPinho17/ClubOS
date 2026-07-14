"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
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

  if (!orgs || orgs.length <= 1) return null;

  const selectValue = activeOrgId ?? orgs[0].id;

  async function switchOrg(id: string) {
    if (id === selectValue) return;

    await api.post("/me/active-organization", { organizationId: id });
    setActiveOrganizationId(id);
    invalidateTenantQueries(queryClient);

    const name = orgs?.find((o) => o.id === id)?.name;
    toast.info(name ? `Organização: ${name}` : "Organização alterada");
  }

  if (compact) {
    return (
      <div className="min-w-0 flex-1">
        <label className="sr-only" htmlFor="org-switcher-mobile">
          Organização
        </label>
        <select
          id="org-switcher-mobile"
          value={selectValue}
          onChange={(e) => void switchOrg(e.target.value)}
          className="flex h-9 w-full min-w-0 rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

  return (
    <div className="border-b p-3">
      <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Building2 className="h-3.5 w-3.5" />
        Organização
      </label>

      <select
        value={selectValue}
        onChange={(e) => void switchOrg(e.target.value)}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
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
