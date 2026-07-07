import { Logger } from '@nestjs/common';

const logger = new Logger('Healthcheck');

/** Ping opcional para Healthchecks.io (ou similar) apos job de lembretes. */
export async function pingQuotaRemindersHealthcheck(): Promise<void> {
  const url = process.env.HEALTHCHECK_QUOTA_REMINDERS_URL?.trim();
  if (!url) return;

  try {
    const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(10_000) });
    if (!res.ok) {
      logger.warn(`Healthcheck lembretes respondeu ${res.status}`);
    }
  } catch (e) {
    logger.warn(`Falha ao enviar ping de healthcheck: ${(e as Error).message}`);
  }
}
