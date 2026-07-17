import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "outline" | "secondary";
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actions?: EmptyStateAction[];
  /** Menos padding — útil dentro de cartões (ex.: dashboard). */
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actions,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center px-4 text-center",
        compact ? "py-6" : "py-12",
      )}
    >
      <div
        className={cn(
          "mb-4 rounded-full bg-muted p-3",
          compact && "mb-3 p-2.5",
        )}
      >
        <Icon
          className={cn(
            "text-muted-foreground",
            compact ? "h-6 w-6" : "h-8 w-8",
          )}
          aria-hidden
        />
      </div>
      <h3 className={cn("font-semibold", compact ? "text-base" : "text-lg")}>
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {actions && actions.length > 0 && (
        <div
          className={cn(
            "flex flex-wrap items-center justify-center gap-2",
            compact ? "mt-4" : "mt-6",
          )}
        >
          {actions.map((action) => {
            if (action.href) {
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className={cn(
                    buttonVariants({ variant: action.variant ?? "default" }),
                    "min-h-11",
                  )}
                >
                  {action.label}
                </Link>
              );
            }
            return (
              <Button
                key={action.label}
                type="button"
                variant={action.variant ?? "default"}
                className="min-h-11"
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
