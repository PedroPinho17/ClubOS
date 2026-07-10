"use client";

import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  requireCheckbox?: boolean;
  checkboxLabel?: string;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
  onConfirm,
  loading = false,
  requireCheckbox = false,
  checkboxLabel = "Confirmo esta acção",
}: ConfirmDialogProps) {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!open) setChecked(false);
  }, [open]);

  async function handleConfirm() {
    await onConfirm();
  }

  const confirmDisabled = loading || (requireCheckbox && !checked);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="whitespace-pre-line">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {requireCheckbox && (
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            <span>{checkboxLabel}</span>
          </label>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            {cancelLabel}
          </AlertDialogCancel>
          <Button
            type="button"
            variant={variant === "destructive" ? "destructive" : "default"}
            disabled={confirmDisabled}
            className={cn(
              variant === "destructive" &&
                "bg-destructive text-destructive-foreground",
            )}
            onClick={() => void handleConfirm()}
          >
            {loading ? "A processar..." : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
