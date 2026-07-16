"use client";

import type { CardData } from "@/lib/types";
import { BASE_W, BASE_H } from "../card-frame";
import { Fields, LogoBlock, Photo } from "../card-primitives";

export function ClassicCard({ data }: { data: CardData }) {
  const l = data.layout;
  return (
    <div
      style={{
        width: BASE_W,
        height: BASE_H,
        color: l.textColor,
        background: `linear-gradient(135deg, ${l.gradientFrom}, ${l.gradientTo})`,
        display: "flex",
        padding: 26,
        position: "relative",
      }}
    >
      <div
        style={{ width: "34%", borderRight: `1px solid ${l.accentColor}55` }}
        className="flex items-center justify-center pr-4"
      >
        <LogoBlock data={data} size={30} />
      </div>
      <div className="flex flex-1 flex-col justify-center pl-6">
        <Fields data={data} />
        {l.footerText && (
          <div style={{ fontSize: 14, marginTop: 10, opacity: 0.7 }}>
            {l.footerText}
          </div>
        )}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 22,
          right: 22,
          color: l.accentColor,
        }}
      >
        <Photo data={data} size={110} />
      </div>
    </div>
  );
}
