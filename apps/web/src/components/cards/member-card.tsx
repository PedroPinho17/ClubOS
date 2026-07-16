"use client";

import { forwardRef } from "react";
import { CardFrame, type CardProps } from "./card-frame";
import { ClassicCard } from "./templates/classic-card";
import { ModernCard } from "./templates/modern-card";
import { MinimalCard } from "./templates/minimal-card";
import { CrcValeCard, CrcValeVersoCard } from "./templates/crc-vale-card";

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
