"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DropdownMenuProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: "start" | "end";
  className?: string;
}

export function DropdownMenu({
  trigger,
  children,
  align = "end",
  className,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative inline-flex", className)}>
      <div
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        role="button"
        tabIndex={0}
      >
        {trigger}
      </div>
      {open && (
        <div
          id={menuId}
          role="menu"
          className={cn(
            "absolute top-full z-50 mt-1 min-w-[11rem] rounded-md border bg-popover p-1 shadow-md",
            align === "end" ? "right-0" : "left-0",
          )}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

interface DropdownMenuItemProps {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  target?: string;
  rel?: string;
  disabled?: boolean;
  destructive?: boolean;
  className?: string;
}

export function DropdownMenuItem({
  children,
  onClick,
  href,
  target,
  rel,
  disabled,
  destructive,
  className,
}: DropdownMenuItemProps) {
  const baseClass = cn(
    "flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
    disabled
      ? "pointer-events-none opacity-50"
      : "hover:bg-muted focus:bg-muted",
    destructive && !disabled && "text-destructive hover:bg-destructive/10",
    className,
  );

  if (href && !disabled) {
    return (
      <a
        role="menuitem"
        href={href}
        target={target}
        rel={rel}
        className={baseClass}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      className={baseClass}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function DropdownMenuSeparator() {
  return <div role="separator" className="my-1 h-px bg-border" />;
}

export function DropdownMenuLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
      {children}
    </div>
  );
}
