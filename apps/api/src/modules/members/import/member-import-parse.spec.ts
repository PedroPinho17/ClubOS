import { describe, expect, it } from 'vitest';
import { parseBoolean, parseDate, parseDecimal } from './member-import-parse';

describe('member-import-parse', () => {
  it('parseDate aceita dd/mm/aaaa', () => {
    const d = parseDate('15/01/2025');
    expect(d?.getFullYear()).toBe(2025);
    expect(d?.getMonth()).toBe(0);
    expect(d?.getDate()).toBe(15);
  });

  it('parseDecimal aceita virgula', () => {
    expect(parseDecimal('15,50')).toBe(15.5);
  });

  it('parseBoolean reconhece Sim/Não', () => {
    expect(parseBoolean('Sim', false)).toBe(true);
    expect(parseBoolean('Não', true)).toBe(false);
  });
});
