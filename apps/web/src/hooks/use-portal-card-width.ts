'use client';

import { useEffect, useState } from 'react';

/** Largura fluida do cartão no portal (ecrãs pequenos até desktop). */
export function usePortalCardWidth(): number {
  const [width, setWidth] = useState(340);

  useEffect(() => {
    const update = () => {
      const padding = 48;
      const max = 400;
      const min = 280;
      const next = Math.min(max, Math.max(min, window.innerWidth - padding));
      setWidth(next);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return width;
}
