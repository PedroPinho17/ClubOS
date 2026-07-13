import { Skeleton } from "@/components/ui/skeleton";

export default function PortalLoading() {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-10 border-b bg-card/95 px-4 py-3 sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
      </header>
      <main className="mx-auto max-w-lg space-y-4 p-4 sm:p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </main>
    </div>
  );
}
