"use client";

import type { CardData } from "@/lib/types";

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function Photo({ data, size }: { data: CardData; size: number }) {
  if (!data.layout.showFoto) return null;

  if (data.member.photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={data.member.photoUrl}
        alt={data.member.name}
        crossOrigin="anonymous"
        style={{ width: size, height: size, objectFit: "cover" }}
        className="rounded-lg border-2 border-white/70"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.34 }}
      className="flex items-center justify-center rounded-lg border-2 border-white/70 bg-white/15 font-bold"
    >
      {initials(data.member.name)}
    </div>
  );
}

export function Fields({
  data,
  dense = false,
}: {
  data: CardData;
  dense?: boolean;
}) {
  const l = data.layout;
  return (
    <div style={{ lineHeight: 1.15 }}>
      <div
        style={{ fontSize: 20, letterSpacing: 2, opacity: 0.8 }}
        className="uppercase"
      >
        {l.cardTitle}
      </div>
      {l.showNome && (
        <div
          style={{ fontSize: dense ? 34 : 40, fontWeight: 800, marginTop: 4 }}
        >
          {data.member.name}
        </div>
      )}
      {l.showCargo && data.member.cardRole && (
        <div style={{ fontSize: 20, marginTop: 6, opacity: 0.9 }}>
          <span style={{ opacity: 0.7 }}>{l.cargoLabel}:</span>{" "}
          {data.member.cardRole}
        </div>
      )}
      {l.showNumero && (
        <div style={{ fontSize: 24, marginTop: 8, fontWeight: 600 }}>
          N.º {data.numeroFormatado}
        </div>
      )}
      {l.showPlano && data.member.planName && (
        <div style={{ fontSize: 18, marginTop: 4, opacity: 0.85 }}>
          {data.member.planName}
        </div>
      )}
      {l.showEmail && data.member.email && (
        <div style={{ fontSize: 16, marginTop: 4, opacity: 0.8 }}>
          {data.member.email}
        </div>
      )}
      {l.showTelefone && data.member.phone && (
        <div style={{ fontSize: 16, marginTop: 2, opacity: 0.8 }}>
          {data.member.phone}
        </div>
      )}
      {l.showValidade && data.validityText && (
        <div style={{ fontSize: 16, marginTop: 8, opacity: 0.75 }}>
          {data.validityText}
        </div>
      )}
    </div>
  );
}

export function LogoBlock({
  data,
  size = 26,
}: {
  data: CardData;
  size?: number;
}) {
  if (data.organization.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={data.organization.logoUrl}
        alt={data.organization.name}
        crossOrigin="anonymous"
        style={{ maxHeight: size * 2.6, maxWidth: 180, objectFit: "contain" }}
      />
    );
  }
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div style={{ fontSize: size, fontWeight: 800, letterSpacing: 1 }}>
        {data.organization.name}
      </div>
    </div>
  );
}
