/** Mapa de colunas do modelo de importacao (paridade gestao_socios). */

export const TEMPLATE_HEADERS = [
  'Número',
  'Nome',
  'Email',
  'Telefone',
  'Data de adesão',
  'Plano de quota',
  'Texto extra no cartão',
  'Validade no cartão',
  'Ativo',
  'Notas',
  'Pagamento data',
  'Pagamento valor',
  'Pagamento referência',
  'Pagamento notas',
] as const;

export const TEMPLATE_EXAMPLE_ROWS: string[][] = [
  [
    '1',
    'João Exemplo',
    'joao@clube.pt',
    '912345678',
    '15/01/2025',
    'Quota social — mensal',
    'Equipa sénior',
    '',
    'Sim',
    'Importado via Excel',
    '01/01/2026',
    '15',
    '2026-01',
    'Quota de janeiro',
  ],
  ['1', '', '', '', '', '', '', '', '', '', '01/02/2026', '15', '2026-02', 'Quota de fevereiro'],
];

const ALIASES: Record<string, string[]> = {
  numero: ['numero', 'número', 'n.º', 'nº', 'num', 'numero de socio', 'número de sócio'],
  nome: ['nome', 'nome completo'],
  email: ['email', 'e-mail'],
  telefone: ['telefone', 'tel', 'telemovel', 'telemóvel'],
  data_adesao: ['data de adesao', 'data de adesão', 'data adesao', 'data adesão', 'adesao', 'adesão'],
  quota_plan: ['plano de quota', 'plano', 'quota', 'tipo de pagamento', 'tipo pagamento'],
  cargo_cartao: ['texto extra no cartao', 'texto extra no cartão', 'cargo', 'cargo cartao', 'cargo cartão'],
  validade_manual: ['validade no cartao', 'validade no cartão', 'validade', 'validade manual'],
  ativo: ['ativo', 'estado', 'socio ativo', 'sócio ativo'],
  notas: ['notas', 'notas internas'],
  pagamento_data: ['pagamento data', 'data pagamento', 'pagamento - data'],
  pagamento_valor: ['pagamento valor', 'valor pagamento', 'pagamento - valor', 'valor'],
  pagamento_referencia: [
    'pagamento referencia',
    'pagamento referência',
    'referencia pagamento',
    'referência pagamento',
    'pagamento - referencia',
    'pagamento - referência',
    'referencia',
    'referência',
  ],
  pagamento_notas: ['pagamento notas', 'pagamento - notas'],
};

export const MEMBER_FIELDS = [
  'nome',
  'email',
  'telefone',
  'data_adesao',
  'quota_plan',
  'cargo_cartao',
  'validade_manual',
  'ativo',
  'notas',
] as const;

export function normalizeHeader(header: string): string {
  return header
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/** Indice da coluna → campo interno. */
export function mapHeaderIndexes(headerRow: unknown[]): Record<number, string> {
  const normalizedAliases = new Map<string, string>();
  for (const [field, labels] of Object.entries(ALIASES)) {
    for (const label of labels) {
      normalizedAliases.set(normalizeHeader(label), field);
    }
  }

  const map: Record<number, string> = {};
  headerRow.forEach((header, index) => {
    if (header === null || header === undefined) return;
    const normalized = normalizeHeader(String(header));
    if (!normalized) return;
    const field = normalizedAliases.get(normalized);
    if (field) map[index] = field;
  });
  return map;
}

export function columnMapHasIdentity(columnMap: Record<number, string>): boolean {
  const fields = Object.values(columnMap);
  return fields.includes('nome') || fields.includes('numero');
}
