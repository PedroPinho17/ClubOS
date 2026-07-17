import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function TableBodySkeleton({
  rows = 5,
  cols = 4,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, row) => (
        <tr key={row} className="border-b last:border-0">
          {Array.from({ length: cols }).map((__, col) => (
            <td key={col} className="p-3">
              <Skeleton className="h-4 w-full max-w-[140px]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function ReportsOverviewSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className={i === 3 ? "lg:col-span-2" : undefined}>
          <CardContent className="space-y-4 pt-6">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function SettingsOrgSkeleton() {
  return (
    <div className="flex flex-wrap items-start gap-6">
      <Skeleton className="h-20 w-20 rounded-lg" />
      <div className="grid flex-1 gap-3 sm:grid-cols-2">
        <Skeleton className="h-10 sm:col-span-2" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10 w-40 sm:col-span-2" />
      </div>
    </div>
  );
}

export function ModuleSectionsSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="space-y-3 pt-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** Cartões mobile enquanto a lista carrega. */
export function MobileCardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="A carregar">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-lg border p-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

/** KPIs do dashboard enquanto as estatísticas carregam. */
export function DashboardKpisSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      aria-busy="true"
      aria-label="A carregar indicadores"
    >
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="space-y-3 pt-6">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** Linhas de lista (ex.: últimos pagamentos) enquanto carregam. */
export function ListRowsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <ul className="space-y-3" aria-busy="true" aria-label="A carregar">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-36 max-w-full" />
            <Skeleton className="h-3 w-28 max-w-full" />
          </div>
          <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
        </li>
      ))}
    </ul>
  );
}

/** Fallback curto para RoleGate / páginas a verificar sessão. */
export function RoleGateSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="A carregar">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72 max-w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

/** Conteúdo do portal enquanto `/portal/me` carrega. */
export function PortalPageSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="A carregar portal">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-32" />
        </CardContent>
      </Card>
      <div className="flex justify-center">
        <Skeleton className="h-[200px] w-full max-w-[340px] rounded-[24px]" />
      </div>
      <Card>
        <CardContent className="space-y-3 pt-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
