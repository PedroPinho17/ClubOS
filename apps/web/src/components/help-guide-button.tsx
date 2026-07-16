"use client";

import Link from "next/link";
import { CircleHelp, X } from "lucide-react";
import { useState } from "react";
import { GettingStartedCard } from "@/components/getting-started-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDialogA11y } from "@/hooks/use-dialog-a11y";
import { useEffectiveRole } from "@/hooks/use-effective-role";
import { isStaffRole } from "@/lib/staff-roles";

/** Atalho permanente para o guia de primeiros passos (staff). */
export function HelpGuideButton() {
  const { effectiveRole } = useEffectiveRole();
  const [open, setOpen] = useState(false);
  const a11y = useDialogA11y(open, () => setOpen(false), "help-guide-title");

  if (!isStaffRole(effectiveRole)) return null;

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="gap-1.5 text-muted-foreground"
        aria-label="Ajuda — primeiros passos"
        onClick={() => setOpen(true)}
      >
        <CircleHelp className="h-4 w-4" />
        <span className="hidden sm:inline">Ajuda</span>
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center"
          {...a11y}
        >
          <Card className="my-4 w-full max-w-lg">
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 id="help-guide-title" className="text-lg font-semibold">
                    Como usar o ClubOS
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Guia rápido para configurar o clube.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Fechar"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <GettingStartedCard compact />
              <div className="flex flex-wrap gap-2 text-sm">
                <Link
                  href="/recuperar-password"
                  className="text-muted-foreground underline hover:text-foreground"
                  onClick={() => setOpen(false)}
                >
                  Recuperar password
                </Link>
                <span className="text-muted-foreground">·</span>
                <Link
                  href="/members"
                  className="text-muted-foreground underline hover:text-foreground"
                  onClick={() => setOpen(false)}
                >
                  Membros
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
