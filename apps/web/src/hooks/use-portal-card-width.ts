"use client";

import { useEffect, useState } from "react";

type FluidCardWidthOptions = {
  min?: number;
  max?: number;
  padding?: number;
};

/** Largura fluida do cartão (portal e pré-visualização no backoffice). */
export function useFluidCardWidth(options: FluidCardWidthOptions = {}): number {
  const min = options.min ?? 280;
  const max = options.max ?? 400;
  const padding = options.padding ?? 48;
  const [width, setWidth] = useState(Math.min(max, 340));

  useEffect(() => {
    const update = () => {
      const next = Math.min(max, Math.max(min, window.innerWidth - padding));
      setWidth(next);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [min, max, padding]);

  return width;
}

/** @deprecated Preferir `useFluidCardWidth` */
export function usePortalCardWidth(): number {
  return useFluidCardWidth({ min: 280, max: 400, padding: 48 });
}
