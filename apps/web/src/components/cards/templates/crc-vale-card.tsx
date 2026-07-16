"use client";

import { QRCodeSVG } from "qrcode.react";
import type { CardData } from "@/lib/types";
import { BASE_W, BASE_H } from "../card-frame";
import { initials, Photo } from "../card-primitives";

export function CrcValeCard({ data }: { data: CardData }) {
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

export function CrcValeVersoCard({ data }: { data: CardData }) {
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
