"use client";

import type { CardData } from "@/lib/types";
import { BASE_W, BASE_H } from "../card-frame";
import { Fields, LogoBlock, Photo } from "../card-primitives";

export function MinimalCard({ data }: { data: CardData }) {
  const l = data.layout;
  return (
    <div
      style={{
        width: BASE_W,
        height: BASE_H,
        color: l.textColor,
        background: `linear-gradient(160deg, ${l.gradientFrom} 0%, ${l.gradientTo} 70%)`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 30,
      }}
    >
      <div className="flex items-start justify-between">
        <LogoBlock data={data} size={24} />
        <Photo data={data} size={96} />
      </div>
      <Fields data={data} dense />
      {l.footerText && (
        <div style={{ fontSize: 14, opacity: 0.7 }}>{l.footerText}</div>
      )}
    </div>
  );
}
