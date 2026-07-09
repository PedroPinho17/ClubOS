import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'secondary';
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actions?: EmptyStateAction[];
}

export function EmptyState({ icon: Icon, title, description, actions }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-4 rounded-full bg-muted p-3">
        <Icon className="h-8 w-8 text-muted-foreground" aria-hidden />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {actions && actions.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {actions.map((action) => {
            if (action.href) {
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className={cn(buttonVariants({ variant: action.variant ?? 'default' }), 'min-h-11')}
                >
                  {action.label}
                </Link>
              );
            }
            return (
              <Button
                key={action.label}
                type="button"
                variant={action.variant ?? 'default'}
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
