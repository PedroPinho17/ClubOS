"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  CreditCard,
  Users,
} from "lucide-react";
import { RoleGate } from "@/components/role-gate";
import { QueryErrorCard } from "@/components/query-error-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { STAFF_ROLES } from "@/lib/staff-roles";
import { NAV_ITEMS, filterNavItems } from "@/lib/nav";
import { useEffectiveRole } from "@/hooks/use-effective-role";
import { useTenantQueryKey } from "@/hooks/use-tenant-query-key";
import type { DashboardStats } from "@/lib/types";

const QUICK_LINK_HREFS = [
  "/reports",
  "/communications",
  "/members",
  "/payments",
];

export default function DashboardPage() {
  return (
    <RoleGate roles={[...STAFF_ROLES]}>
      <DashboardPageContent />
    </RoleGate>
  );
}

function DashboardPageContent() {
  const { effectiveRole } = useEffectiveRole();
  const statsKey = useTenantQueryKey(["dashboard", "stats"]);
  const modulesKey = useTenantQueryKey(["modules", "enabled"]);

  const { data, isLoading, isError, refetch } = useQuery<DashboardStats>({
    queryKey: statsKey,
    queryFn: () => api.get<DashboardStats>("/dashboard/stats"),
  });

  const { data: enabled } = useQuery<string[]>({
    queryKey: modulesKey,
    queryFn: () => api.get<string[]>("/modules/enabled"),
  });

  const quickLinks = filterNavItems(
    NAV_ITEMS.filter((item) => QUICK_LINK_HREFS.includes(item.href)),
    new Set(enabled ?? []),
    effectiveRole,
  );

  const kpis = [
    { label: "Membros", value: data?.members ?? 0, icon: Users },
    { label: "Membros ativos", value: data?.activeMembers ?? 0, icon: Users },
    {
      label: "Receita total",
      value: `${(data?.revenue ?? 0).toFixed(2)} €`,
      icon: CreditCard,
    },
    {
      label: "Receita este mês",
      value: `${(data?.revenueThisMonth ?? 0).toFixed(2)} €`,
      sub:
        data?.revenueMonthChangePct != null
          ? `${data.revenueMonthChangePct > 0 ? "+" : ""}${data.revenueMonthChangePct}% vs mês anterior`
          : undefined,
      icon: CreditCard,
    },
  ];

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <QueryErrorCard onRetry={() => void refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {c.label}
              </CardTitle>
              <c.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {isLoading ? "…" : c.value}
              </div>
              {c.sub && (
                <p className="mt-1 text-xs text-muted-foreground">{c.sub}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Situação de quotas</CardTitle>
            <Link
              href="/members"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              Ver membros <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-lg border px-4 py-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-2xl font-bold">
                  {isLoading ? "…" : (data?.overdue ?? 0)}
                </p>
                <p className="text-sm text-muted-foreground">Em atraso</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border px-4 py-3">
              <Clock className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-2xl font-bold">
                  {isLoading ? "…" : (data?.dueSoon ?? 0)}
                </p>
                <p className="text-sm text-muted-foreground">A vencer</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border px-4 py-3">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">
                  {isLoading ? "…" : (data?.payments ?? 0)}
                </p>
                <p className="text-sm text-muted-foreground">Pagamentos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Últimos pagamentos</CardTitle>
            <Link
              href="/payments"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              Ver todos <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">A carregar…</p>
            ) : data?.recentPayments && data.recentPayments.length > 0 ? (
              <ul className="space-y-3">
                {data.recentPayments.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.memberName}</p>
                      <p className="text-muted-foreground">
                        N.º {p.memberNumber} ·{" "}
                        {new Date(p.paidAt).toLocaleDateString("pt-PT")}
                      </p>
                    </div>
                    <Badge variant="success">{p.amount.toFixed(2)} €</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Sem pagamentos registados.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {quickLinks.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
