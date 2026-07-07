/** Parsing de datas, booleanos e valores do Excel. */

export function nullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s === '' ? null : s;
}

export function cellWasExplicitlyEmpty(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
}

export function parseBoolean(value: unknown, defaultValue: boolean): boolean {
  if (value === null || value === undefined || value === '') return defaultValue;
  const s = String(value).trim().toLowerCase();
  if (['sim', 's', 'yes', 'y', '1', 'true', 'ativo'].includes(s)) return true;
  if (['nao', 'não', 'n', 'no', '0', 'false', 'inativo'].includes(s)) return false;
  return defaultValue;
}

export function parseDecimal(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const s = String(value).trim().replace(/\s/g, '').replace(',', '.');
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

export function parseDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return startOfDay(value);
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(excelEpoch.getTime() + value * 86_400_000);
    return Number.isNaN(d.getTime()) ? null : startOfDay(d);
  }

  const s = String(value).trim();
  if (!s) return null;

  const formats = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
  ];

  for (const re of formats) {
    const m = s.match(re);
    if (!m) continue;
    let day: number;
    let month: number;
    let year: number;
    if (re.source.startsWith('^(\\d{4})')) {
      year = Number(m[1]);
      month = Number(m[2]);
      day = Number(m[3]);
    } else {
      day = Number(m[1]);
      month = Number(m[2]);
      year = Number(m[3]);
    }
    const d = new Date(year, month - 1, day);
    if (d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day) {
      return startOfDay(d);
    }
  }

  const parsed = new Date(s);
  return Number.isNaN(parsed.getTime()) ? null : startOfDay(parsed);
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function formatYearMonth(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}
