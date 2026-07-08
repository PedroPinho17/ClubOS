import { describe, expect, it } from 'vitest';
import { GDPR_ERASED_NAME, isGdprErased } from './member-gdpr.service';

describe('member-gdpr', () => {
  it('isGdprErased identifica membro apagado', () => {
    expect(isGdprErased({ name: GDPR_ERASED_NAME })).toBe(true);
    expect(isGdprErased({ name: 'Joao Silva' })).toBe(false);
  });
});
