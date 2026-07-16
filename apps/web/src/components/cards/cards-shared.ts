import { CARD_MM, captureCardElement } from "@/lib/card-export";

/** Largura máxima da pré-visualização no backoffice (desktop). */
export const CARD_PREVIEW_MAX_WIDTH = 420;

/** @deprecated Preferir largura fluida via `useFluidCardWidth` */
export const CARD_PREVIEW_WIDTH = CARD_PREVIEW_MAX_WIDTH;
export const CARD_PREVIEW_HEIGHT = CARD_PREVIEW_WIDTH * (540 / 856);

export const MEMBER_SELECT_CLASS =
  "mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

export async function captureCardImage(el: HTMLElement | null) {
  if (!el) throw new Error("Elemento do cartão indisponível.");
  return captureCardElement(el);
}

export { CARD_MM };
