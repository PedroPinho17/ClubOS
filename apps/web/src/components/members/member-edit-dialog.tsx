"use client";

import { FileDown, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDialogA11y } from "@/hooks/use-dialog-a11y";
import { safeDownloadJson } from "@/lib/safe-download";
import type { MembershipPlan } from "@/lib/types";

export interface MemberEditForm {
  name: string;
  email: string;
  phone: string;
  status: "ACTIVE" | "INACTIVE";
  quotaPlanId: string;
  cardRole: string;
  notes: string;
  joinedAt: string;
  cardValidUntil: string;
}

interface MemberEditDialogProps {
  open: boolean;
  memberId: string | null;
  form: MemberEditForm;
  plans: MembershipPlan[] | undefined;
  canManage: boolean;
  saving: boolean;
  gdprErasing: boolean;
  onClose: () => void;
  onChange: (form: MemberEditForm) => void;
  onSubmit: () => void;
  onGdprErase: () => void;
}

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function MemberEditDialog({
  open,
  memberId,
  form,
  plans,
  canManage,
  saving,
  gdprErasing,
  onClose,
  onChange,
  onSubmit,
  onGdprErase,
}: MemberEditDialogProps) {
  const a11y = useDialogA11y(open, onClose, "member-edit-title");

  if (!open || !memberId) return null;

  const isGdprErased = form.name === "Apagado RGPD";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center"
      {...a11y}
    >
      <Card className="my-4 w-full max-w-2xl border-primary/40">
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="member-edit-title" className="text-lg font-semibold">
                Editar sócio
              </h2>
              <p className="text-sm text-muted-foreground">
                Altere os dados e guarde as alterações.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (form.name.trim()) onSubmit();
            }}
          >
            <div className="space-y-1 sm:col-span-2">
              <label className="text-sm font-medium">Nome</label>
              <Input
                value={form.name}
                onChange={(e) => onChange({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => onChange({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Telefone</label>
              <Input
                value={form.phone}
                onChange={(e) => onChange({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Plano</label>
              <select
                value={form.quotaPlanId}
                onChange={(e) =>
                  onChange({ ...form, quotaPlanId: e.target.value })
                }
                className={selectClass}
              >
                <option value="">Sem plano</option>
                {(plans ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Estado</label>
              <select
                value={form.status}
                onChange={(e) =>
                  onChange({
                    ...form,
                    status: e.target.value as "ACTIVE" | "INACTIVE",
                  })
                }
                className={selectClass}
              >
                <option value="ACTIVE">Ativo</option>
                <option value="INACTIVE">Inativo</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Data de adesão</label>
              <Input
                type="date"
                value={form.joinedAt}
                onChange={(e) =>
                  onChange({ ...form, joinedAt: e.target.value })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Adesão usada na quota se não houver pagamentos.
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Validade cartão</label>
              <Input
                type="date"
                value={form.cardValidUntil}
                onChange={(e) =>
                  onChange({ ...form, cardValidUntil: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Opcional. Sobrepõe o cálculo automático da validade.
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Cargo no cartão</label>
              <Input
                value={form.cardRole}
                onChange={(e) =>
                  onChange({ ...form, cardRole: e.target.value })
                }
                placeholder="Sócio"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-sm font-medium">Notas</label>
              <Input
                value={form.notes}
                onChange={(e) => onChange({ ...form, notes: e.target.value })}
              />
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? "A guardar..." : "Guardar alterações"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
            </div>

            {canManage && !isGdprErased && (
              <div className="mt-2 rounded-lg border border-dashed p-4 sm:col-span-2">
                <h3 className="mb-1 text-sm font-semibold">RGPD</h3>
                <p className="mb-3 text-xs text-muted-foreground">
                  Exportar ou apagar dados pessoais deste sócio.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      void safeDownloadJson(
                        `/members/${memberId}/gdpr-export`,
                        `gdpr-export-${memberId}.json`,
                      )
                    }
                  >
                    <FileDown className="h-4 w-4" />
                    Exportar RGPD
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={gdprErasing}
                    onClick={onGdprErase}
                  >
                    <ShieldAlert className="h-4 w-4" />
                    {gdprErasing ? "A apagar..." : "Apagar dados RGPD"}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
