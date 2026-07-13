import { Skeleton } from "@/components/ui/skeleton";

export default function LoginLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm space-y-4 rounded-lg border bg-card p-6">
        <Skeleton className="mx-auto h-8 w-24" />
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-4 w-full max-w-xs" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    </div>
  );
}
