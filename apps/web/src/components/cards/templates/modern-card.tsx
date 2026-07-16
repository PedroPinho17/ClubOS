"use client";

import type { CardData } from "@/lib/types";
import { BASE_W, BASE_H } from "../card-frame";
import { Fields, LogoBlock, Photo } from "../card-primitives";

export function ModernCard({ data }: { data: CardData }) {
  const l = data.layout;
  return (
    <div
      style={{
        width: BASE_W,
        height: BASE_H,
        color: l.textColor,
        background: `linear-gradient(135deg, ${l.gradientFrom}, ${l.gradientTo})`,
        position: "relative",
      }}
    >
      <div style={{ height: 40, background: l.accentColor, opacity: 0.9 }} />
      <div className="flex items-center justify-between px-8 pt-4">
        <LogoBlock data={data} size={26} />
      </div>
      <div className="flex items-center gap-6 px-8 pt-4">
        <Photo data={data} size={130} />
        <div className="flex-1">
          <Fields data={data} />
        </div>
      </div>
      {l.footerText && (
        <div
          style={{ fontSize: 14, opacity: 0.7 }}
          className="absolute bottom-4 left-8"
        >
          {l.footerText}
        </div>
      )}
    </div>
  );
}
