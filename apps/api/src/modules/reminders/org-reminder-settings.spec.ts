import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DIAS_AVISO_QUOTA,
  parseOrgReminderSettings,
  periodReferenceFromDueDate,
} from './org-reminder-settings';

describe('parseOrgReminderSettings', () => {
  it('defaults when empty', () => {
    expect(parseOrgReminderSettings({})).toEqual({
      diasAvisoQuota: DEFAULT_DIAS_AVISO_QUOTA,
      lembretesAutomaticos: false,
    });
  });

  it('parses custom values', () => {
    expect(
      parseOrgReminderSettings({ dias_aviso_quota: 14, lembretes_automaticos: true }),
    ).toEqual({
      diasAvisoQuota: 14,
      lembretesAutomaticos: true,
    });
  });
});

describe('periodReferenceFromDueDate', () => {
  it('extracts YYYY-MM-DD', () => {
    expect(periodReferenceFromDueDate('2026-07-15T00:00:00.000Z')).toBe('2026-07-15');
  });
});
