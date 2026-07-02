export const CARD_TEMPLATES = ['classic', 'modern', 'minimal', 'crc_vale'] as const;
export type CardTemplate = (typeof CARD_TEMPLATES)[number];

export type QrContent = 'validacao' | 'numero' | 'dados';

export interface CardLayout {
  template: CardTemplate;
  /** Ativa o layout oficial CRC Vale como opcao selecionavel. */
  crcValeEnabled: boolean;
  gradientFrom: string;
  gradientTo: string;
  accentColor: string;
  textColor: string;
  cardTitle: string;
  cargoLabel: string;
  numeroPrefix: string;
  footerText: string;
  slogan: string;
  qrContent: QrContent;
  showNome: boolean;
  showNumero: boolean;
  showFoto: boolean;
  showValidade: boolean;
  showCargo: boolean;
  showPlano: boolean;
  showEmail: boolean;
  showTelefone: boolean;
  showAdesao: boolean;
}

export interface CardTemplateInfo {
  key: CardTemplate;
  label: string;
  group: 'base' | 'clube';
  description: string;
}

export const CARD_CATALOG: CardTemplateInfo[] = [
  { key: 'classic', label: 'Clássico', group: 'base', description: 'Modelo base com gradiente e logótipo.' },
  { key: 'modern', label: 'Moderno', group: 'base', description: 'Modelo base com faixa de destaque e tipografia forte.' },
  { key: 'minimal', label: 'Minimal', group: 'base', description: 'Modelo base limpo e discreto.' },
  { key: 'crc_vale', label: 'CRC Vale (oficial)', group: 'clube', description: 'Layout personalizado do clube, com frente detalhada.' },
];

export function defaultCardLayout(org: { primaryColor: string }): CardLayout {
  return {
    template: 'classic',
    crcValeEnabled: false,
    gradientFrom: org.primaryColor || '#16a34a',
    gradientTo: '#0f172a',
    accentColor: '#c9a227',
    textColor: '#ffffff',
    cardTitle: 'Sócio',
    cargoLabel: 'Cargo',
    numeroPrefix: '',
    footerText: '',
    slogan: 'Juntos Somos Mais Fortes',
    qrContent: 'validacao',
    showNome: true,
    showNumero: true,
    showFoto: true,
    showValidade: true,
    showCargo: true,
    showPlano: false,
    showEmail: false,
    showTelefone: false,
    showAdesao: false,
  };
}

/** Garante que o template ativo e permitido (CRC Vale so se ativado). */
export function ensureTemplateAllowed(layout: CardLayout): CardLayout {
  if (layout.template === 'crc_vale' && !layout.crcValeEnabled) {
    return { ...layout, template: 'classic' };
  }
  if (!CARD_TEMPLATES.includes(layout.template)) {
    return { ...layout, template: 'classic' };
  }
  return layout;
}

/** Mistura os defaults (a partir do branding da org) com o que esta guardado. */
export function resolveCardLayout(
  org: { primaryColor: string },
  stored: Partial<CardLayout> | null | undefined,
): CardLayout {
  const merged: CardLayout = { ...defaultCardLayout(org), ...(stored ?? {}) };
  return ensureTemplateAllowed(merged);
}
