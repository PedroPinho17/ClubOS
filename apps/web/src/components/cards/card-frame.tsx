"use client";

import { forwardRef } from "react";
import type { CardData } from "@/lib/types";

// Espaco de coordenadas fixo (10x mm do cartao CR80: 85.6 x 53.98).
export const BASE_W = 856;
export const BASE_H = 540;

export interface CardProps {
  data: CardData;
  /** Largura de render em px (mantem o racio CR80). */
  width?: number;
  /** Frente ou verso (verso apenas para CRC Vale). */
  side?: "front" | "back";
}

/** Moldura que escala o conteudo 856x540 para a largura desejada. */
export const CardFrame = forwardRef<
  HTMLDivElement,
  { width: number; children: React.ReactNode }
>(function CardFrame({ width, children }, ref) {
  const scale = width / BASE_W;
  return (
    <div
      ref={ref}
      style={{ width, height: width * (BASE_H / BASE_W) }}
      className="relative overflow-hidden rounded-[24px] shadow-lg"
    >
      <div
        style={{
          width: BASE_W,
          height: BASE_H,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
});
