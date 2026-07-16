"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useEffectiveRole } from "@/hooks/use-effective-role";
import { canManageMembers, isImperador } from "@/lib/permissions";

type Step = {
  title: string;
  description: string;
  href: string;
  adminOnly?: boolean;
  imperadorOnly?: boolean;
};

const STEPS: Step[] = [
  {
    title: "Criar organização (se ainda não existe)",
    description:
      "Imperador: Módulos → Novo clube. Activa módulos base automaticamente.",
    href: "/modules",
    imperadorOnly: true,
  },
  {
    title: "Branding e staff",
    description: "Logótipo, cor e convite de administrador / tesoureiro.",
    href: "/settings",
    adminOnly: true,
  },
  {
    title: "Criar um plano de quota",
    description: "Define valores e periodicidade das quotas.",
    href: "/membership-plans",
    adminOnly: true,
  },
  {
    title: "Importar ou criar sócios",
    description: "Excel (dry-run) ou adicionar o primeiro sócio em Membros.",
    href: "/members",
    adminOnly: true,
  },
  {
    title: "Registar o 1.º pagamento",
    description: "Começa o histórico de quotas e recibos.",
    href: "/payments",
  },
  {
    title: "Cartões e portal (opcional)",
    description:
      "Layout CRC Vale / clássico e conceder acesso ao portal do sócio.",
    href: "/cards",
    adminOnly: true,
  },
];

type GettingStartedCardProps = {
  /** Versão sem margem exterior / header reduzido (modal Ajuda). */
  compact?: boolean;
};

/** Checklist de onboarding da organização (dashboard / guia Ajuda). */
export function GettingStartedCard({
  compact = false,
}: GettingStartedCardProps) {
  const { effectiveRole, isLoading } = useEffectiveRole();
  const canManage = !isLoading && canManageMembers(effectiveRole);
  const imperador = !isLoading && isImperador(effectiveRole);

  const steps = STEPS.filter((s) => {
    if (s.imperadorOnly && !imperador) return false;
    if (s.adminOnly && !canManage) return false;
    return true;
  });

  return (
    <Card
      className={cn(
        !compact && "border-primary/25 bg-primary/5",
        compact && "border-0 shadow-none",
      )}
    >
      {!compact && (
        <CardHeader>
          <CardTitle className="text-lg">Primeiros passos</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ordem sugerida para pôr um clube a funcionar no ClubOS. Guia
            completo: documentação «Como adicionar um clube novo».
          </p>
        </CardHeader>
      )}
      <CardContent className={cn("space-y-3", compact && "p-0")}>
        {steps.map((step, index) => (
          <div
            key={`${step.href}-${step.title}`}
            className="flex flex-col gap-3 rounded-lg border bg-background p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {index + 1}
              </span>
              <div>
                <p className="font-medium">{step.title}</p>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
            <Link
              href={step.href}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "shrink-0",
              )}
            >
              Abrir
            </Link>
          </div>
        ))}
        {!canManage && (
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Planos e importação de sócios são para administradores. Como
            tesoureiro, pode registar pagamentos assim que houver sócios.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
