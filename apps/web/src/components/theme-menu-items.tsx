"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const THEME_OPTIONS = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
] as const;

export function ThemeMenuItems({ onSelect }: { onSelect?: () => void }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="px-2.5 py-2">
        <div className="h-4 w-16 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="py-1">
      <p className="px-2.5 pb-1 text-xs font-medium text-muted-foreground">
        Tema
      </p>
      {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="menuitemradio"
            aria-checked={active}
            onClick={() => {
              setTheme(value);
              onSelect?.();
            }}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-foreground/90 transition-colors hover:bg-accent",
              active && "bg-accent/70",
            )}
          >
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1">{label}</span>
            {active ? <Check className="h-4 w-4 text-primary" /> : null}
          </button>
        );
      })}
    </div>
  );
}
