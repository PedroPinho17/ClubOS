'use client';

import { ChevronDown, KeyRound, LogOut, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { passkey, signOut } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

interface UserMenuProps {
  name?: string | null;
  email?: string | null;
}

function MenuItem({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-foreground/90 transition-colors hover:bg-accent',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function UserMenu({ name, email }: UserMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const displayName = name?.trim() || 'Utilizador';
  const initial = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  async function logout() {
    setOpen(false);
    await signOut();
    router.replace('/login');
  }

  async function addPasskey() {
    setOpen(false);
    await passkey.addPasskey({ name: displayName });
    alert('Passkey registada com sucesso.');
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          'flex h-9 items-center gap-2 rounded-full py-1 pl-1 pr-2.5 text-sm transition-colors',
          'hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          open && 'bg-muted/80',
        )}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground ring-1 ring-border/60">
          {initial}
        </span>
        <span className="hidden max-w-[9rem] truncate font-medium sm:inline">{displayName}</span>
        <ChevronDown
          className={cn('h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-60 origin-top-right animate-in fade-in-0 zoom-in-95 rounded-lg border bg-card p-1.5 text-card-foreground shadow-md"
        >
          <div className="mb-1.5 rounded-md bg-muted/50 px-3 py-2.5">
            <div className="truncate text-sm font-medium">{displayName}</div>
            {email ? <div className="truncate text-xs text-muted-foreground">{email}</div> : null}
          </div>

          <MenuItem onClick={addPasskey}>
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            Adicionar passkey
          </MenuItem>

          <Link
            href="/account"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-foreground/90 transition-colors hover:bg-accent"
          >
            <UserRound className="h-4 w-4 text-muted-foreground" />
            Editar dados
          </Link>

          <div className="my-1.5 h-px bg-border" />

          <MenuItem onClick={logout} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
            <LogOut className="h-4 w-4" />
            Sair
          </MenuItem>
        </div>
      ) : null}
    </div>
  );
}
