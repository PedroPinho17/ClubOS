import { describe, expect, it } from 'vitest';
import { buildWhatsappUrl, normalizeWhatsappPhone } from './whatsapp.util';

describe('normalizeWhatsappPhone', () => {
  it('assumes Portugal for 9 digits', () => {
    expect(normalizeWhatsappPhone('912345678')).toBe('351912345678');
  });

  it('strips formatting', () => {
    expect(normalizeWhatsappPhone('+351 912 345 678')).toBe('351912345678');
  });

  it('returns null for empty', () => {
    expect(normalizeWhatsappPhone('')).toBeNull();
  });
});

describe('buildWhatsappUrl', () => {
  it('encodes message', () => {
    expect(buildWhatsappUrl('351912345678', 'Olá')).toContain('wa.me/351912345678');
    expect(buildWhatsappUrl('351912345678', 'Olá')).toContain('text=');
  });
});
