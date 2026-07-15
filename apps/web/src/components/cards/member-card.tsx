"use client";

import { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { CardData } from "@/lib/types";

// Espaco de coordenadas fixo (10x mm do cartao CR80: 85.6 x 53.98).
const BASE_W = 856;
const BASE_H = 540;

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

interface CardProps {
  data: CardData;
  /** Largura de render em px (mantem o racio CR80). */
  width?: number;
  /** Frente ou verso (verso apenas para CRC Vale). */
  side?: "front" | "back";
}

/** Moldura que escala o conteudo 856x540 para a largura desejada. */
const CardFrame = forwardRef<
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

function Photo({ data, size }: { data: CardData; size: number }) {
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

function Fields({ data, dense = false }: { data: CardData; dense?: boolean }) {
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

function LogoBlock({ data, size = 26 }: { data: CardData; size?: number }) {
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

function ClassicCard({ data }: { data: CardData }) {
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

function ModernCard({ data }: { data: CardData }) {
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

function MinimalCard({ data }: { data: CardData }) {
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

function CrcValeCard({ data }: { data: CardData }) {
  const l = data.layout;
  const navy = "#0a1f44";
  const blue = "#4a90c8";
  const sky = "#e8f4fc";
  return (
    <div
      style={{
        width: BASE_W,
        height: BASE_H,
        position: "relative",
        background: `repeating-linear-gradient(-52deg, ${sky}, ${sky} 26px, #d4e8f5 26px, #d4e8f5 52px)`,
        overflow: "hidden",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Cabecalho */}
      <div style={{ textAlign: "center", paddingTop: 18, color: navy }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>
          CLUBE RECREATIVO
        </div>
        <div
          style={{ fontSize: 44, fontWeight: 900, lineHeight: 1, color: blue }}
        >
          {data.organization.name.toUpperCase().includes("VALE")
            ? "VALE"
            : data.organization.name.toUpperCase()}
        </div>
        <div
          style={{
            fontSize: 13,
            letterSpacing: 3,
            color: navy,
            opacity: 0.7,
            marginTop: 2,
          }}
        >
          TRADIÇÃO • ESPORTE • CULTURA
        </div>
      </div>

      {/* Painel navy com clip-path */}
      <div
        style={{
          position: "absolute",
          top: 120,
          left: 0,
          width: "62%",
          height: 420,
          background: navy,
          color: "#fff",
          clipPath: "polygon(0 0, 100% 0, 88% 100%, 0 100%)",
          padding: "22px 26px",
        }}
      >
        <div className="flex gap-4">
          {l.showFoto && <Photo data={data} size={120} />}
          <div>
            <div
              style={{
                fontSize: 16,
                letterSpacing: 1,
                color: blue,
                fontWeight: 700,
              }}
            >
              CARTÃO SÓCIO
            </div>
            {l.showCargo && (
              <div style={{ fontSize: 18, marginTop: 2 }}>
                {data.member.cardRole ?? data.layout.cardTitle}
              </div>
            )}
          </div>
        </div>
        {l.showNome && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 14, color: blue }}>NOME</div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                textTransform: "uppercase",
              }}
            >
              {data.member.name}
            </div>
          </div>
        )}
        {(l.showNumero || l.showValidade) && (
          <div className="flex gap-10" style={{ marginTop: 12 }}>
            {l.showNumero && (
              <div>
                <div style={{ fontSize: 14, color: blue }}>MATRÍCULA</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                  {data.numeroFormatado}
                </div>
              </div>
            )}
            {l.showValidade && (
              <div>
                <div style={{ fontSize: 14, color: blue }}>VALIDADE</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                  {data.validadePeriodo}
                </div>
              </div>
            )}
          </div>
        )}
        <div style={{ marginTop: 14 }} className="flex items-center gap-3">
          <div style={{ background: "#fff", padding: 6, borderRadius: 6 }}>
            <QRCodeSVG value={data.qrPayload} size={78} />
          </div>
          <div style={{ fontStyle: "italic", fontSize: 18, color: sky }}>
            {data.layout.slogan}
          </div>
        </div>
      </div>

      {/* Coluna direita: crest + badge */}
      <div
        style={{
          position: "absolute",
          top: 140,
          right: 26,
          width: "30%",
          textAlign: "center",
          color: navy,
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            margin: "0 auto",
            borderRadius: "50%",
            background: "#fff",
            border: `4px solid ${navy}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 30,
            fontWeight: 900,
            color: navy,
            overflow: "hidden",
          }}
        >
          {data.organization.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.organization.logoUrl}
              alt={data.organization.name}
              crossOrigin="anonymous"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                padding: 6,
              }}
            />
          ) : (
            initials(data.organization.name)
          )}
        </div>
        <div
          style={{
            marginTop: 14,
            display: "inline-block",
            padding: "6px 16px",
            borderRadius: 20,
            background: data.active ? navy : "#64748b",
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
          }}
        >
          {data.active ? "SÓCIO ATIVO" : "SÓCIO INATIVO"}
        </div>
        <div
          style={{
            marginTop: 16,
            height: 30,
            background:
              "repeating-linear-gradient(90deg, #0a1f44, #0a1f44 3px, transparent 3px, transparent 6px)",
          }}
        />
        <div style={{ fontSize: 12, letterSpacing: 2, marginTop: 8 }}>
          SÓCIO VERIFICADO ✓
        </div>
      </div>

      {/* Faixa holografica */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 12,
          height: "100%",
          background:
            "linear-gradient(180deg, #ff6ec4, #7873f5, #4ade80, #facc15)",
          opacity: 0.8,
        }}
      />
    </div>
  );
}

function CrcValeVersoCard({ data }: { data: CardData }) {
  const navy = "#0a1f44";
  const blue = "#4a90c8";
  const sky = "#e8f4fc";
  const rules = [
    "Este cartão é pessoal e intransmissível.",
    "A apresentação deste cartão é obrigatória no acesso às instalações.",
    "O sócio deve manter a quota em dia para usufruir dos benefícios do clube.",
    "Em caso de perda ou roubo, contacte imediatamente a direção do clube.",
  ];

  return (
    <div
      style={{
        width: BASE_W,
        height: BASE_H,
        position: "relative",
        background: navy,
        color: "#fff",
        overflow: "hidden",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `repeating-linear-gradient(52deg, transparent, transparent 30px, ${blue}22 30px, ${blue}22 60px)`,
        }}
      />

      <div
        style={{
          position: "relative",
          padding: "28px 32px",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            textAlign: "center",
            borderBottom: `2px solid ${blue}`,
            paddingBottom: 14,
          }}
        >
          <div
            style={{
              fontSize: 18,
              letterSpacing: 2,
              color: blue,
              fontWeight: 700,
            }}
          >
            CLUBE RECREATIVO
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 900,
              color: sky,
              lineHeight: 1.1,
            }}
          >
            {data.organization.name.toUpperCase()}
          </div>
        </div>

        <div style={{ flex: 1, marginTop: 18, fontSize: 15, lineHeight: 1.55 }}>
          <div
            style={{
              fontSize: 13,
              letterSpacing: 2,
              color: blue,
              fontWeight: 700,
              marginBottom: 10,
            }}
          >
            CONDIÇÕES DE UTILIZAÇÃO
          </div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {rules.map((rule) => (
              <li key={rule} style={{ marginBottom: 6 }}>
                {rule}
              </li>
            ))}
          </ul>
          {data.layout.footerText && (
            <p
              style={{
                marginTop: 14,
                fontSize: 14,
                color: sky,
                fontStyle: "italic",
              }}
            >
              {data.layout.footerText}
            </p>
          )}
        </div>

        <div
          style={{
            marginTop: "auto",
            paddingTop: 16,
            borderTop: `1px solid ${blue}55`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 16,
          }}
        >
          <div style={{ fontSize: 13, color: sky, lineHeight: 1.5 }}>
            <div style={{ fontWeight: 700, color: "#fff" }}>Contactos</div>
            <div>{data.member.email ?? "secretaria@crcvale.pt"}</div>
            <div>{data.member.phone ?? "+351 000 000 000"}</div>
          </div>
          <div style={{ textAlign: "center", minWidth: 180 }}>
            <div
              style={{
                borderTop: `2px solid ${blue}`,
                marginTop: 36,
                paddingTop: 6,
                fontSize: 12,
                color: sky,
              }}
            >
              Assinatura da Direção
            </div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 44,
            background: "linear-gradient(180deg, #1a1a2e, #0d0d1a)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 14,
            left: 32,
            right: 32,
            height: 16,
            borderRadius: 4,
            background:
              "repeating-linear-gradient(90deg, #333 0px, #333 8px, #555 8px, #555 16px)",
            opacity: 0.85,
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 12,
          height: "100%",
          background:
            "linear-gradient(180deg, #ff6ec4, #7873f5, #4ade80, #facc15)",
          opacity: 0.8,
        }}
      />
    </div>
  );
}

export const MemberCard = forwardRef<HTMLDivElement, CardProps>(
  function MemberCard({ data, width = 380, side = "front" }, ref) {
    const render = () => {
      if (side === "back" && data.layout.template === "crc_vale") {
        return <CrcValeVersoCard data={data} />;
      }
      switch (data.layout.template) {
        case "modern":
          return <ModernCard data={data} />;
        case "minimal":
          return <MinimalCard data={data} />;
        case "crc_vale":
          return <CrcValeCard data={data} />;
        case "classic":
        default:
          return <ClassicCard data={data} />;
      }
    };
    return (
      <CardFrame ref={ref} width={width}>
        {render()}
      </CardFrame>
    );
  },
);
