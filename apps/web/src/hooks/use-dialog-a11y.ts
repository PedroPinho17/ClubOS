"use client";

import { useEffect, useRef, type RefObject } from "react";

type DialogA11yProps = {
  role: "dialog";
  "aria-modal": true;
  "aria-labelledby": string;
  tabIndex: -1;
  ref: RefObject<HTMLDivElement | null>;
};

/**
 * Escape para fechar, foco inicial no painel e restauro do foco ao fechar.
 * Spreads no contentor do diálogo (com tabIndex=-1).
 */
export function useDialogA11y(
  open: boolean,
  onClose: () => void,
  labelledBy: string,
): DialogA11yProps {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previousFocus.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const frame = requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelector<HTMLElement>(
        'button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      (focusable ?? panel).focus();
    });

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      previousFocus.current?.focus?.();
    };
  }, [open, onClose]);

  return {
    ref: panelRef,
    role: "dialog",
    "aria-modal": true,
    "aria-labelledby": labelledBy,
    tabIndex: -1,
  };
}
