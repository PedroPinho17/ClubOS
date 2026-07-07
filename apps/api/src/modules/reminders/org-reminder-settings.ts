/** Chaves em OrganizationSetting (paridade gestao_socios). */
export const ORG_SETTING_DIAS_AVISO_QUOTA = 'dias_aviso_quota';
export const ORG_SETTING_LEMBRETES_AUTOMATICOS = 'lembretes_automaticos';

export const DEFAULT_DIAS_AVISO_QUOTA = 7;

export interface OrgReminderSettings {
  diasAvisoQuota: number;
  lembretesAutomaticos: boolean;
}

function parseBool(value: unknown, defaultValue: boolean): boolean {
  if (value === true || value === 'true' || value === 1 || value === '1') return true;
  if (value === false || value === 'false' || value === 0 || value === '0') return false;
  return defaultValue;
}

function parsePositiveInt(value: unknown, defaultValue: number): number {
  const n = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(n) || n < 1) return defaultValue;
  return Math.min(n, 90);
}

export function parseOrgReminderSettings(
  raw: Record<string, unknown> | null | undefined,
): OrgReminderSettings {
  return {
    diasAvisoQuota: parsePositiveInt(raw?.[ORG_SETTING_DIAS_AVISO_QUOTA], DEFAULT_DIAS_AVISO_QUOTA),
    lembretesAutomaticos: parseBool(raw?.[ORG_SETTING_LEMBRETES_AUTOMATICOS], false),
  };
}

export async function loadOrgReminderSettings(
  prisma: { organizationSetting: { findMany: (args: unknown) => Promise<{ key: string; value: unknown }[]> } },
  organizationId: string,
): Promise<OrgReminderSettings> {
  const rows = await prisma.organizationSetting.findMany({
    where: {
      organizationId,
      key: { in: [ORG_SETTING_DIAS_AVISO_QUOTA, ORG_SETTING_LEMBRETES_AUTOMATICOS] },
    },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return parseOrgReminderSettings(map);
}

/** YYYY-MM-DD a partir de ISO date (vencimento). */
export function periodReferenceFromDueDate(nextDueIso: string): string {
  return nextDueIso.slice(0, 10);
}
