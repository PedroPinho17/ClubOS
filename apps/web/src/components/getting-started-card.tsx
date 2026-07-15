"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useEffectiveRole } from "@/hooks/use-effective-role";
import { canManageMembers } from "@/lib/permissions";

const STEPS = [
  {
    n: 1,
    title: "Criar um plano de quota",
    description: "Define valores e periodicidade das quotas.",
    href: "/membership-plans",
    adminOnly: true,
  },
  {
    n: 2,
    title: "Importar ou criar sócios",
    description: "Excel ou adicionar o primeiro sócio em Membros.",
    href: "/members",
    adminOnly: true,
  },
  {
    n: 3,
    title: "Registar o 1.º pagamento",
    description: "Começa o histórico de quotas e recibos.",
    href: "/payments",
    adminOnly: false,
  },
] as const;

/** Checklist visível quando a organização ainda não tem sócios. */
export function GettingStartedCard() {
  const { effectiveRole, isLoading } = useEffectiveRole();
  const canManage = !isLoading && canManageMembers(effectiveRole);

  const steps = STEPS.filter((s) => canManage || !s.adminOnly);

  return (
    <Card className="border-primary/25 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-lg">Primeiros passos</CardTitle>
        <p className="text-sm text-muted-foreground">
          Esta organização ainda não tem sócios. Siga a ordem abaixo para
          começar a usar o ClubOS.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.href}
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
