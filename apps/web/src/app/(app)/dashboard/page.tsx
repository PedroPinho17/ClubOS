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
import { GettingStartedCard } from "@/components/getting-started-card";
import {
  DashboardKpisSkeleton,
  ListRowsSkeleton,
} from "@/components/page-skeletons";
import { RoleGate } from "@/components/role-gate";
import { QueryErrorCard } from "@/components/query-error-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
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

  const isEmptyOrg = !isLoading && data != null && data.members === 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {isError && <QueryErrorCard onRetry={() => void refetch()} />}

      {!isError && isEmptyOrg && <GettingStartedCard />}

      {!isError && !isLoading && data != null && data.overdue > 0 && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm"
        >
          <AlertTriangle
            className="h-4 w-4 shrink-0 text-destructive"
            aria-hidden
          />
          <p className="min-w-0 flex-1 font-medium">
            {data.overdue} {data.overdue === 1 ? "sócio" : "sócios"} em atraso
          </p>
          <Link
            href="/members"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "min-h-11",
            )}
          >
            Ver em Membros
            <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
          </Link>
        </div>
      )}

      {!isError &&
        (isLoading ? (
          <DashboardKpisSkeleton />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((c) => (
              <Card key={c.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {c.label}
                  </CardTitle>
                  <c.icon
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden
                  />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{c.value}</div>
                  {c.sub && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {c.sub}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ))}

      {!isError && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">Situação de quotas</CardTitle>
              <Link
                href="/members"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "min-h-11",
                )}
              >
                Ver membros <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
              </Link>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {isLoading ? (
                <>
                  <Skeleton className="h-[72px] w-36 rounded-lg" />
                  <Skeleton className="h-[72px] w-36 rounded-lg" />
                  <Skeleton className="h-[72px] w-36 rounded-lg" />
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 rounded-lg border px-4 py-3">
                    <AlertTriangle
                      className="h-5 w-5 text-destructive"
                      aria-hidden
                    />
                    <div>
                      <p className="text-2xl font-bold">{data?.overdue ?? 0}</p>
                      <p className="text-sm text-muted-foreground">Em atraso</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border px-4 py-3">
                    <Clock className="h-5 w-5 text-amber-600" aria-hidden />
                    <div>
                      <p className="text-2xl font-bold">{data?.dueSoon ?? 0}</p>
                      <p className="text-sm text-muted-foreground">A vencer</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border px-4 py-3">
                    <CreditCard
                      className="h-5 w-5 text-muted-foreground"
                      aria-hidden
                    />
                    <div>
                      <p className="text-2xl font-bold">
                        {data?.payments ?? 0}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Pagamentos
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">Últimos pagamentos</CardTitle>
              <Link
                href="/payments"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "min-h-11",
                )}
              >
                Ver todos <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
              </Link>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <ListRowsSkeleton count={4} />
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
                <EmptyState
                  icon={CreditCard}
                  title="Sem pagamentos registados"
                  description="Quando registar quotas, os últimos pagamentos aparecem aqui."
                  actions={[
                    {
                      label: "Registar pagamento",
                      href: "/payments",
                    },
                  ]}
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {!isError && quickLinks.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "min-h-11",
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
