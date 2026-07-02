export const REDIS_CLIENT = 'REDIS_CLIENT';

/**
 * Prefixo global de chaves (best practice: convencao de nomes consistente).
 * Formato: clubos:<dominio>:<id>. Ex.: clubos:receipt:<paymentId>
 */
export const KEY_PREFIX = 'clubos';

export const RECEIPT_QUEUE = 'receipts';

/** TTL do cache de PDFs de recibos (24h). Best practice: TTL em chaves de cache. */
export const RECEIPT_CACHE_TTL_SECONDS = 60 * 60 * 24;

export const receiptCacheKey = (paymentId: string) => `${KEY_PREFIX}:receipt:${paymentId}`;
