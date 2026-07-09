import { describe, expect, it } from 'vitest';
import {
  buildMemberPayload,
  isPaymentOnlyRow,
  rowIsEmpty,
} from './import-row-validator';

describe('import-row-validator', () => {
  it('detecta linha vazia', () => {
    expect(rowIsEmpty({ nome: '', numero: null })).toBe(true);
    expect(rowIsEmpty({ nome: 'Joao' })).toBe(false);
  });

  it('detecta linha apenas de pagamento', () => {
    expect(
      isPaymentOnlyRow({
        numero: '12',
        pagamento_valor: '10',
        pagamento_data: '01/01/2026',
      }),
    ).toBe(true);
    expect(
      isPaymentOnlyRow({
        numero: '12',
        nome: 'Joao',
        pagamento_valor: '10',
      }),
    ).toBe(false);
  });

  it('rejeita data de adesao em falta', () => {
    expect(() =>
      buildMemberPayload({ nome: 'Joao', email: 'joao@test.pt' }, []),
    ).toThrow(/data de adesão/i);
  });
});
