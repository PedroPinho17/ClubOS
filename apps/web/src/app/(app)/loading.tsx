import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton enquanto o chunk da página carrega — mantém o shell do layout visível. */
export default function AppLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-52" />
      <Skeleton className="h-4 w-full max-w-md" />
      <div className="space-y-3 rounded-lg border bg-card p-6">
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-36" />
        </div>
      </div>
      <div className="rounded-lg border bg-card">
        <div className="space-y-3 border-b p-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="space-y-3 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
