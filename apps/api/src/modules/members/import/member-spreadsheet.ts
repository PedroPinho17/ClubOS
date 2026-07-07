import * as XLSX from 'xlsx';
import { TEMPLATE_EXAMPLE_ROWS, TEMPLATE_HEADERS } from './member-import-column-map';

export function readSpreadsheetRows(buffer: Buffer): unknown[][] {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });
  return rows.filter((row) => rowHasContent(row));
}

export function buildImportTemplateBuffer(): Buffer {
  return buildSpreadsheetBuffer([[...TEMPLATE_HEADERS], ...TEMPLATE_EXAMPLE_ROWS]);
}

export function buildSpreadsheetBuffer(rows: string[][]): Buffer {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Socios');
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
}

function rowHasContent(row: unknown[]): boolean {
  return row.some((value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (typeof value === 'number') return true;
    if (value instanceof Date) return true;
    return false;
  });
}
