import { Skeleton } from "@/components/ui/skeleton";

/** Shell do backoffice enquanto a sessão ou o chunk da página carregam. */
export function AppShellSkeleton({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="hidden w-64 flex-col border-r bg-card md:flex">
        <div className="border-b p-4">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="space-y-2 p-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-end border-b bg-card px-4 md:px-6">
          <Skeleton className="h-9 w-28 rounded-full" />
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b bg-card p-2 md:hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 shrink-0" />
          ))}
        </nav>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-muted/20 p-4 md:p-8">
          {children ?? (
            <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
              A carregar…
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
