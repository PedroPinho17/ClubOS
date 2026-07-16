"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDialogA11y } from "@/hooks/use-dialog-a11y";
import { ORGS_QUERY_KEY } from "@/hooks/use-my-organizations";
import { api } from "@/lib/api";
import { setActiveOrganizationId } from "@/lib/org-context";
import { toast } from "@/lib/toast";
import type { Organization } from "@/lib/types";

type CreateOrganizationDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: (org: Organization) => void;
};

/** Dialogo Imperador: criar nova organização (clube) e activá-la. */
export function CreateOrganizationDialog({
  open,
  onClose,
  onCreated,
}: CreateOrganizationDialogProps) {
  const a11y = useDialogA11y(open, onClose, "create-org-title");
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const createOrg = useMutation({
    mutationFn: () =>
      api.post<Organization>("/organizations", {
        name: name.trim(),
        slug: slug.trim() || undefined,
      }),
    onSuccess: async (org) => {
      toast.success(`Organização "${org.name}" criada`);
      setActiveOrganizationId(org.id);
      await api.post("/me/active-organization", { organizationId: org.id });
      await queryClient.invalidateQueries({ queryKey: ORGS_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: ["modules"] });
      setName("");
      setSlug("");
      onCreated?.(org);
      onClose();
      window.location.assign("/dashboard");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      {...a11y}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Card className="w-full max-w-md">
        <CardContent className="space-y-4 pt-6">
          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </span>
            <div>
              <h2 id="create-org-title" className="text-lg font-semibold">
                Novo clube / organização
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Cria o tenant, activa módulos base e define-o como organização
                activa. Depois: branding → planos → sócios.
              </p>
            </div>
          </div>

          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim().length < 2) return;
              createOrg.mutate();
            }}
          >
            <div className="space-y-1">
              <label htmlFor="org-name" className="text-sm font-medium">
                Nome
              </label>
              <Input
                id="org-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="CRC Vale"
                required
                minLength={2}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="org-slug" className="text-sm font-medium">
                Slug (opcional)
              </label>
              <Input
                id="org-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="crc-vale"
              />
              <p className="text-xs text-muted-foreground">
                Se vazio, é gerado a partir do nome.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createOrg.isPending || name.trim().length < 2}
              >
                {createOrg.isPending ? "A criar..." : "Criar organização"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
