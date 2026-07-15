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
