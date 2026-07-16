"use client";

import { useEffect } from "react";

/** Fecha overlays com Escape e aplica atributos ARIA de diálogo. */
export function useDialogA11y(
  open: boolean,
  onClose: () => void,
  labelledBy: string,
) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return {
    role: "dialog" as const,
    "aria-modal": true as const,
    "aria-labelledby": labelledBy,
  };
}
