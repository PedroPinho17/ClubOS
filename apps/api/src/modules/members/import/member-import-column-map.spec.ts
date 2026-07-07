import { describe, expect, it } from 'vitest';
import { columnMapHasIdentity, mapHeaderIndexes, normalizeHeader } from './member-import-column-map';

describe('member-import-column-map', () => {
  it('normaliza cabecalhos com acentos', () => {
    expect(normalizeHeader('  Data de Adesão  ')).toBe('data de adesao');
  });

  it('mapeia cabecalho PT completo', () => {
    const map = mapHeaderIndexes([
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
    ]);
    expect(map[0]).toBe('numero');
    expect(map[1]).toBe('nome');
    expect(map[5]).toBe('quota_plan');
    expect(columnMapHasIdentity(map)).toBe(true);
  });

  it('rejeita cabecalho sem nome nem numero', () => {
    const map = mapHeaderIndexes(['Foo', 'Bar']);
    expect(columnMapHasIdentity(map)).toBe(false);
  });
});
