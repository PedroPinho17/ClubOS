"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, ChevronDown, Puzzle } from "lucide-react";
import { useState } from "react";
import { CreateOrganizationDialog } from "@/components/create-organization-dialog";
import { ModuleSectionsSkeleton } from "@/components/page-skeletons";
import { QueryErrorCard } from "@/components/query-error-card";
import { RoleGate } from "@/components/role-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { useTenantQueryKey } from "@/hooks/use-tenant-query-key";
import type { PlatformModule } from "@/lib/types";
import { cn } from "@/lib/utils";

const CATEGORY_LABEL: Record<PlatformModule["category"], string> = {
  CORE: "Core",
  BASE: "Módulos base",
  PLUGIN: "Plugins (modalidades)",
};

const DEFAULT_OPEN: Record<PlatformModule["category"], boolean> = {
  CORE: false,
  BASE: true,
  PLUGIN: false,
};

function ModuleCategorySection({
  title,
  count,
  defaultOpen,
  children,
}: {
  title: string;
  count: number;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card>
      <CardHeader className="p-0">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center gap-3 rounded-t-lg px-6 py-4 text-left hover:bg-muted/40"
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {count} {count === 1 ? "módulo" : "módulos"}
            </p>
          </div>
        </button>
      </CardHeader>
      {open ? (
        <CardContent className="space-y-2 pt-0">{children}</CardContent>
      ) : null}
    </Card>
  );
}

export default function ModulesPage() {
  return (
    <RoleGate roles={["imperador"]}>
      <ModulesPageContent />
    </RoleGate>
  );
}

function ModulesPageContent() {
  const queryClient = useQueryClient();
  const modulesKey = useTenantQueryKey(["modules"]);
  const [createOrgOpen, setCreateOrgOpen] = useState(false);

  const {
    data: modules,
    isPending,
    isError,
    refetch,
  } = useQuery<PlatformModule[]>({
    queryKey: modulesKey,
    queryFn: () => api.get<PlatformModule[]>("/modules"),
    staleTime: 2 * 60_000,
  });

  const toggle = useMutation({
    mutationFn: ({ slug, enabled }: { slug: string; enabled: boolean }) =>
      api.put(`/modules/${slug}`, { enabled }),
    onSuccess: (_, { enabled }) => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      toast.success(enabled ? "Módulo ativado" : "Módulo desativado");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const groups: PlatformModule["category"][] = ["CORE", "BASE", "PLUGIN"];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-bold">Módulos</h1>
          <p className="text-sm text-muted-foreground">
            Ativa ou desativa módulos para esta organização. Os módulos core
            estão sempre ativos. Para um clube novo, cria primeiro a
            organização.
          </p>
        </div>
        <Button
          type="button"
          className="shrink-0"
          onClick={() => setCreateOrgOpen(true)}
        >
          <Building2 className="mr-2 h-4 w-4" />
          Novo clube
        </Button>
      </div>

      <CreateOrganizationDialog
        open={createOrgOpen}
        onClose={() => setCreateOrgOpen(false)}
      />

      <div className="space-y-6">
        {isError ? (
          <QueryErrorCard onRetry={() => void refetch()} />
        ) : isPending && !modules ? (
          <ModuleSectionsSkeleton />
        ) : (modules ?? []).length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState
                icon={Puzzle}
                title="Sem módulos disponíveis"
                description="Não há módulos configurados para esta organização."
              />
            </CardContent>
          </Card>
        ) : (
          groups.map((category) => {
            const items = (modules ?? []).filter(
              (m) => m.category === category,
            );
            if (items.length === 0) return null;
            return (
              <ModuleCategorySection
                key={category}
                title={CATEGORY_LABEL[category]}
                count={items.length}
                defaultOpen={DEFAULT_OPEN[category]}
              >
                {items.map((m) => (
                  <div
                    key={m.slug}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 font-medium">
                        {m.name}
                        {m.enabled && <Badge variant="success">Ativo</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {m.slug}
                      </div>
                    </div>
                    {m.isCore ? (
                      <Badge variant="muted">Sempre ativo</Badge>
                    ) : (
                      <Button
                        variant={m.enabled ? "outline" : "default"}
                        size="sm"
                        disabled={toggle.isPending}
                        onClick={() =>
                          toggle.mutate({ slug: m.slug, enabled: !m.enabled })
                        }
                      >
                        {m.enabled ? "Desativar" : "Ativar"}
                      </Button>
                    )}
                  </div>
                ))}
              </ModuleCategorySection>
            );
          })
        )}
      </div>
    </div>
  );
}
