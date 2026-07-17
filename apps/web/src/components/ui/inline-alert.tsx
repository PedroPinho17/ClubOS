import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type InlineAlertVariant = "info" | "warning" | "error";

const VARIANT_STYLES: Record<
  InlineAlertVariant,
  { container: string; Icon: LucideIcon }
> = {
  info: {
    container: "border-border bg-muted/60 text-foreground dark:bg-muted/40",
    Icon: Info,
  },
  warning: {
    container:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100",
    Icon: AlertTriangle,
  },
  error: {
    container: "border-destructive/30 bg-destructive/5 text-destructive",
    Icon: AlertCircle,
  },
};

type InlineAlertProps = {
  children: ReactNode;
  variant?: InlineAlertVariant;
  /** Substitui o ícone predefinido da variante. */
  icon?: LucideIcon;
  className?: string;
  role?: "status" | "alert";
};

/** Aviso inline (offline, info, erro suave) — sem cartão. */
export function InlineAlert({
  children,
  variant = "info",
  icon,
  className,
  role = "status",
}: InlineAlertProps) {
  const styles = VARIANT_STYLES[variant];
  const Icon = icon ?? styles.Icon;

  return (
    <div
      role={role}
      aria-live={role === "alert" ? "assertive" : "polite"}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-4 py-3 text-sm",
        styles.container,
        className,
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
